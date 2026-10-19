import { prisma } from "@/lib/prisma";
import { ConnectionStatus, ConnectionType, Prisma } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/lib/errors";
import { type AuthUser } from "@/lib/auth";
import { resolveClerkUser } from "@/lib/clerkUser";
import { NotificationService } from "@/modules/notifications";
import type {
  ConnectionDto,
  ConnectionListQuery,
  ConnectionListResponse,
  ConnectionRequestsResponse,
  ConnectionStatusResponse,
  ConnectionUserSummary,
  CreateConnectionInput,
  UpdateConnectionStatusInput,
} from "./connections.types";

type PrismaUserWithRelations = Prisma.UserGetPayload<{
  include: {
    studentDetail: true;
    mentorDetail: true;
  };
}>;

type PrismaConnectionWithUsers = Prisma.ConnectionGetPayload<{
  include: {
    initiator: {
      include: {
        studentDetail: true;
        mentorDetail: true;
      };
    };
    receiver: {
      include: {
        studentDetail: true;
        mentorDetail: true;
      };
    };
  };
}>;

export class ConnectionsService {
  /**
   * Resolves the authenticated user (Clerk or local JWT) to a Prisma User record.
   */
  static async resolveDbUser(authUser: AuthUser) {
    let email = authUser.email;
    let role = authUser.role;

    if ((!email || email.endsWith("@clerk.user")) && authUser.id.startsWith("user_")) {
      const clerkResolved = await resolveClerkUser(authUser.id);
      if (clerkResolved?.email) {
        email = clerkResolved.email;
        if (!role && clerkResolved.role) {
          role = clerkResolved.role;
        }
      }
    }

    if (email && !email.endsWith("@clerk.user")) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (user) {
        return user;
      }
    }

    const numId = parseInt(authUser.id, 10);
    if (!isNaN(numId)) {
      const user = await prisma.user.findUnique({
        where: { id: numId },
      });
      if (user) {
        return user;
      }
    }

    throw new UnauthorizedError(
      `No database user record matches authenticated identity (${authUser.id}). Please register first.`
    );
  }

  /**
   * Dispatches push notification asynchronously without failing the calling database operation.
   */
  private static sendPushSafely(
    userId: number,
    options: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ): void {
    NotificationService.sendToUser(userId, options).catch((err) => {
      console.error(
        `[ConnectionsService.sendPushSafely] Failed to send push notification to user=${userId}:`,
        err
      );
    });
  }

  /**
   * Builds user summary DTO for connection card representation.
   */
  private static mapUserSummary(user: PrismaUserWithRelations): ConnectionUserSummary {
    let headline: string | null = null;
    let university: string | null = null;
    let degree: string | null = null;
    let jobTitle: string | null = null;
    let company: string | null = null;

    if (user.role === "MENTOR" && user.mentorDetail) {
      jobTitle = user.mentorDetail.jobTitle;
      company = user.mentorDetail.company;
      headline = [jobTitle, company].filter(Boolean).join(" @ ") || "Mentor";
    } else if (user.studentDetail) {
      university = user.studentDetail.university;
      degree = user.studentDetail.degree || user.studentDetail.fieldOfStudy;
      headline = [degree, university].filter(Boolean).join(" · ") || "Student";
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      headline,
      university,
      degree,
      jobTitle,
      company,
    };
  }

  /**
   * Maps a Prisma Connection record to a public DTO relative to the current viewer.
   */
  private static mapConnectionToDto(
    connection: PrismaConnectionWithUsers,
    currentUserId: number
  ): ConnectionDto {
    const isInitiator = connection.initiatorId === currentUserId;
    const connectedPrismaUser = isInitiator ? connection.receiver : connection.initiator;

    return {
      id: connection.id,
      initiatorId: connection.initiatorId,
      receiverId: connection.receiverId,
      status: connection.status,
      type: connection.type,
      bookingId: connection.bookingId,
      note: connection.note,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
      connectedUser: this.mapUserSummary(connectedPrismaUser as PrismaUserWithRelations),
    };
  }

  /**
   * Retrieves the current relationship status between the active user and a target user.
   */
  static async getConnectionStatus(
    currentUserId: number,
    targetUserId: number
  ): Promise<ConnectionStatusResponse> {
    if (currentUserId === targetUserId) {
      return { status: "SELF" };
    }

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorId: currentUserId, receiverId: targetUserId },
          { initiatorId: targetUserId, receiverId: currentUserId },
        ],
      },
    });

    if (!connection) {
      return { status: "NONE" };
    }

    if (connection.status === ConnectionStatus.CONNECTED) {
      return {
        status: "CONNECTED",
        connectionId: connection.id,
      };
    }

    if (connection.status === ConnectionStatus.PENDING) {
      const isInitiator = connection.initiatorId === currentUserId;
      return {
        status: isInitiator ? "PENDING_SENT" : "PENDING_RECEIVED",
        connectionId: connection.id,
        isInitiator,
        note: connection.note,
      };
    }

    if (connection.status === ConnectionStatus.DECLINED) {
      return {
        status: "DECLINED",
        connectionId: connection.id,
      };
    }

    if (connection.status === ConnectionStatus.BLOCKED) {
      return {
        status: "BLOCKED",
        connectionId: connection.id,
      };
    }

    return { status: "NONE" };
  }

  /**
   * Sends a connection request or automatically accepts if the other user already sent a pending request.
   */
  static async createConnection(
    initiatorId: number,
    input: CreateConnectionInput
  ): Promise<ConnectionDto> {
    const { receiverId, note } = input;

    if (initiatorId === receiverId) {
      throw new BadRequestError("You cannot send a connection request to yourself.");
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      include: { studentDetail: true, mentorDetail: true },
    });

    if (!receiver) {
      throw new NotFoundError(`User with ID ${receiverId} not found.`);
    }

    // Check for existing connection in either direction
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorId, receiverId },
          { initiatorId: receiverId, receiverId: initiatorId },
        ],
      },
      include: {
        initiator: { include: { studentDetail: true, mentorDetail: true } },
        receiver: { include: { studentDetail: true, mentorDetail: true } },
      },
    });

    if (existing) {
      if (existing.status === ConnectionStatus.CONNECTED) {
        throw new ConflictError("You are already connected with this user.");
      }

      if (existing.status === ConnectionStatus.PENDING) {
        if (existing.initiatorId === initiatorId) {
          throw new ConflictError("A connection request to this user is already pending.");
        }

        // Mutual connection: the other user already requested to connect with initiator.
        // Automatically accept to connect immediately.
        const accepted = await prisma.connection.update({
          where: { id: existing.id },
          data: { status: ConnectionStatus.CONNECTED },
          include: {
            initiator: { include: { studentDetail: true, mentorDetail: true } },
            receiver: { include: { studentDetail: true, mentorDetail: true } },
          },
        });

        // Notify the user who had originally sent the request that it is now connected
        const otherUserId = existing.initiatorId;
        const currentUserName =
          accepted.receiver.id === initiatorId ? accepted.receiver.name : accepted.initiator.name;
        this.sendPushSafely(otherUserId, {
          title: "Connection Accepted",
          body: `${currentUserName} accepted your connection request. You are now connected!`,
          data: {
            route: "/connections",
            type: "CONNECTION_ACCEPTED",
            connectionId: accepted.id,
          },
        });

        return this.mapConnectionToDto(accepted, initiatorId);
      }

      if (existing.status === ConnectionStatus.DECLINED) {
        // Re-open request
        const reopened = await prisma.connection.update({
          where: { id: existing.id },
          data: {
            initiatorId,
            receiverId,
            status: ConnectionStatus.PENDING,
            type: ConnectionType.DIRECT_REQUEST,
            note: note?.trim() || null,
          },
          include: {
            initiator: { include: { studentDetail: true, mentorDetail: true } },
            receiver: { include: { studentDetail: true, mentorDetail: true } },
          },
        });

        // Notify recipient about re-opened connection request
        const noteBody = reopened.note
          ? `: "${reopened.note.length > 100 ? `${reopened.note.slice(0, 97)}...` : reopened.note}"`
          : " sent you a connection request.";
        this.sendPushSafely(receiverId, {
          title: reopened.initiator.name,
          body: `${reopened.initiator.name}${noteBody}`,
          data: {
            route: "/connections?tab=invitations",
            type: "CONNECTION_REQUEST",
            connectionId: reopened.id,
          },
        });

        return this.mapConnectionToDto(reopened, initiatorId);
      }

      if (existing.status === ConnectionStatus.BLOCKED) {
        throw new ForbiddenError("Unable to connect with this user.");
      }
    }

    // Create a new direct connection request
    const created = await prisma.connection.create({
      data: {
        initiatorId,
        receiverId,
        status: ConnectionStatus.PENDING,
        type: ConnectionType.DIRECT_REQUEST,
        note: note?.trim() || null,
      },
      include: {
        initiator: { include: { studentDetail: true, mentorDetail: true } },
        receiver: { include: { studentDetail: true, mentorDetail: true } },
      },
    });

    // Notify recipient about new connection request
    const noteBody = created.note
      ? `: "${created.note.length > 100 ? `${created.note.slice(0, 97)}...` : created.note}"`
      : " sent you a connection request.";
    this.sendPushSafely(receiverId, {
      title: created.initiator.name,
      body: `${created.initiator.name}${noteBody}`,
      data: {
        route: "/connections?tab=invitations",
        type: "CONNECTION_REQUEST",
        connectionId: created.id,
      },
    });

    return this.mapConnectionToDto(created, initiatorId);
  }

  /**
   * Responds to an incoming connection request (accept or decline).
   */
  static async respondToRequest(
    actorUserId: number,
    connectionId: number,
    input: UpdateConnectionStatusInput
  ): Promise<ConnectionDto> {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        initiator: { include: { studentDetail: true, mentorDetail: true } },
        receiver: { include: { studentDetail: true, mentorDetail: true } },
      },
    });

    if (!connection) {
      throw new NotFoundError(`Connection request with ID ${connectionId} not found.`);
    }

    if (connection.receiverId !== actorUserId) {
      throw new ForbiddenError("Only the recipient of this connection request can respond to it.");
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestError(
        `Cannot update connection with status '${connection.status}'. Only pending requests can be answered.`
      );
    }

    const nextStatus =
      input.status === "CONNECTED" ? ConnectionStatus.CONNECTED : ConnectionStatus.DECLINED;

    const updated = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: nextStatus },
      include: {
        initiator: { include: { studentDetail: true, mentorDetail: true } },
        receiver: { include: { studentDetail: true, mentorDetail: true } },
      },
    });

    // If accepted, notify the original initiator
    if (nextStatus === ConnectionStatus.CONNECTED) {
      this.sendPushSafely(updated.initiatorId, {
        title: "Connection Accepted",
        body: `${updated.receiver.name} accepted your connection request. You are now connected!`,
        data: {
          route: "/connections",
          type: "CONNECTION_ACCEPTED",
          connectionId: updated.id,
        },
      });
    }

    return this.mapConnectionToDto(updated, actorUserId);
  }

  /**
   * Removes an existing mutual connection or withdraws a pending outgoing request.
   */
  static async removeConnection(
    actorUserId: number,
    connectionId: number
  ): Promise<{ success: boolean; message: string }> {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundError(`Connection with ID ${connectionId} not found.`);
    }

    const isInitiator = connection.initiatorId === actorUserId;
    const isReceiver = connection.receiverId === actorUserId;

    if (!isInitiator && !isReceiver) {
      throw new ForbiddenError("You do not have permission to remove this connection.");
    }

    // Delete record so both parties cleanly return to disconnected status
    await prisma.connection.delete({
      where: { id: connectionId },
    });

    return {
      success: true,
      message:
        connection.status === ConnectionStatus.CONNECTED
          ? "Connection removed successfully."
          : "Connection request withdrawn successfully.",
    };
  }

  /**
   * Automatically connects student and mentor when a mentorship session booking is confirmed.
   */
  static async autoConnectOnSessionConfirmed(
    studentId: number,
    mentorId: number,
    bookingId: number
  ): Promise<void> {
    if (studentId === mentorId) return;

    try {
      const existing = await prisma.connection.findFirst({
        where: {
          OR: [
            { initiatorId: studentId, receiverId: mentorId },
            { initiatorId: mentorId, receiverId: studentId },
          ],
        },
      });

      if (!existing) {
        const created = await prisma.connection.create({
          data: {
            initiatorId: studentId,
            receiverId: mentorId,
            status: ConnectionStatus.CONNECTED,
            type: ConnectionType.SESSION_BOOKING,
            bookingId,
          },
          include: {
            initiator: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } },
          },
        });
        console.log(
          `[ConnectionsService.autoConnectOnSessionConfirmed] Created connection between student=${studentId} and mentor=${mentorId}`
        );
        this.sendPushSafely(studentId, {
          title: "New Connection",
          body: `You are now connected with ${created.receiver.name}!`,
          data: { route: "/connections", type: "CONNECTION_ACCEPTED", connectionId: created.id },
        });
        this.sendPushSafely(mentorId, {
          title: "New Connection",
          body: `You are now connected with ${created.initiator.name}!`,
          data: { route: "/connections", type: "CONNECTION_ACCEPTED", connectionId: created.id },
        });
      } else if (existing.status !== ConnectionStatus.CONNECTED) {
        const updated = await prisma.connection.update({
          where: { id: existing.id },
          data: {
            status: ConnectionStatus.CONNECTED,
            type: ConnectionType.SESSION_BOOKING,
            bookingId,
          },
          include: {
            initiator: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } },
          },
        });
        console.log(
          `[ConnectionsService.autoConnectOnSessionConfirmed] Upgraded existing connection (${existing.id}) to CONNECTED`
        );
        const studentPartnerName =
          studentId === updated.initiatorId ? updated.receiver.name : updated.initiator.name;
        const mentorPartnerName =
          mentorId === updated.initiatorId ? updated.receiver.name : updated.initiator.name;
        this.sendPushSafely(studentId, {
          title: "New Connection",
          body: `You are now connected with ${studentPartnerName}!`,
          data: { route: "/connections", type: "CONNECTION_ACCEPTED", connectionId: updated.id },
        });
        this.sendPushSafely(mentorId, {
          title: "New Connection",
          body: `You are now connected with ${mentorPartnerName}!`,
          data: { route: "/connections", type: "CONNECTION_ACCEPTED", connectionId: updated.id },
        });
      }
    } catch (error) {
      // Log error but do not fail the booking confirmation transaction
      console.error(
        "[ConnectionsService.autoConnectOnSessionConfirmed] Failed to auto-connect users:",
        error
      );
    }
  }

  /**
   * Lists all active (CONNECTED) connections for a user with pagination and optional search.
   */
  static async listConnections(
    userId: number,
    query: ConnectionListQuery
  ): Promise<ConnectionListResponse> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const baseWhere: Prisma.ConnectionWhereInput = {
      status: ConnectionStatus.CONNECTED,
      OR: [{ initiatorId: userId }, { receiverId: userId }],
    };

    if (query.role) {
      baseWhere.AND = [
        {
          OR: [
            { initiatorId: userId, receiver: { role: query.role } },
            { receiverId: userId, initiator: { role: query.role } },
          ],
        },
      ];
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      baseWhere.AND = [
        ...(Array.isArray(baseWhere.AND) ? baseWhere.AND : baseWhere.AND ? [baseWhere.AND] : []),
        {
          OR: [
            { initiatorId: userId, receiver: { name: { contains: s, mode: "insensitive" } } },
            { receiverId: userId, initiator: { name: { contains: s, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const [total, connections] = await Promise.all([
      prisma.connection.count({ where: baseWhere }),
      prisma.connection.findMany({
        where: baseWhere,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          initiator: { include: { studentDetail: true, mentorDetail: true } },
          receiver: { include: { studentDetail: true, mentorDetail: true } },
        },
      }),
    ]);

    const items = connections.map((conn) =>
      this.mapConnectionToDto(conn as PrismaConnectionWithUsers, userId)
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Lists pending connection invitations (both incoming awaiting response and outgoing sent).
   */
  static async listRequests(userId: number): Promise<ConnectionRequestsResponse> {
    const [incoming, outgoing] = await Promise.all([
      prisma.connection.findMany({
        where: {
          receiverId: userId,
          status: ConnectionStatus.PENDING,
        },
        orderBy: { createdAt: "desc" },
        include: {
          initiator: { include: { studentDetail: true, mentorDetail: true } },
          receiver: { include: { studentDetail: true, mentorDetail: true } },
        },
      }),
      prisma.connection.findMany({
        where: {
          initiatorId: userId,
          status: ConnectionStatus.PENDING,
        },
        orderBy: { createdAt: "desc" },
        include: {
          initiator: { include: { studentDetail: true, mentorDetail: true } },
          receiver: { include: { studentDetail: true, mentorDetail: true } },
        },
      }),
    ]);

    return {
      incoming: incoming.map((conn) =>
        this.mapConnectionToDto(conn as PrismaConnectionWithUsers, userId)
      ),
      outgoing: outgoing.map((conn) =>
        this.mapConnectionToDto(conn as PrismaConnectionWithUsers, userId)
      ),
    };
  }
}
