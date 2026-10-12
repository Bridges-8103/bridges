import { prisma } from "@/lib/prisma";
import { ConnectionStatus, ConnectionType, MessageType } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { NotificationService } from "@/modules/notifications";
import type {
  ConversationSummaryDto,
  GetMessagesOptions,
  MessageDto,
  ParticipantSummary,
  SendMessageInput,
} from "./messages.types";

export class MessagesService {
  /**
   * Ensures an active Connection and Conversation exist between student and mentor for a session booking.
   * If a connection does not exist, provisions Connection, Conversation, Participants, and an initial "Session confirmed" message.
   */
  static async ensureConnectionForBooking(
    studentId: number,
    mentorId: number,
    bookingId?: number
  ) {
    if (studentId === mentorId) {
      throw new BadRequestError("Cannot create a connection with yourself.");
    }

    // Check if a connection already exists in either direction
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { initiatorId: studentId, receiverId: mentorId },
          { initiatorId: mentorId, receiverId: studentId },
        ],
      },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (existingConnection) {
      // Ensure status is CONNECTED
      if (existingConnection.status !== ConnectionStatus.CONNECTED) {
        await prisma.connection.update({
          where: { id: existingConnection.id },
          data: { status: ConnectionStatus.CONNECTED },
        });
      }

      // If conversation already exists, ensure participants exist and return
      if (existingConnection.conversation) {
        const participantUserIds = existingConnection.conversation.participants.map((p) => p.userId);
        const missingUserIds = [studentId, mentorId].filter((id) => !participantUserIds.includes(id));

        if (missingUserIds.length > 0) {
          await prisma.conversationParticipant.createMany({
            data: missingUserIds.map((userId) => ({
              conversationId: existingConnection.conversation!.id,
              userId,
            })),
            skipDuplicates: true,
          });
        }

        return existingConnection.conversation;
      }

      // If connection exists but conversation was missing, create it
      const newConversation = await prisma.conversation.create({
        data: {
          connectionId: existingConnection.id,
          lastMessageText: "Session confirmed",
          lastMessageAt: new Date(),
          participants: {
            create: [
              { userId: studentId },
              { userId: mentorId },
            ],
          },
          messages: {
            create: {
              content: "Session confirmed",
              messageType: MessageType.SYSTEM,
              senderId: null,
            },
          },
        },
      });

      return newConversation;
    }

    // No existing connection found: atomically create Connection, Conversation, and initial system message
    const createdConversation = await prisma.$transaction(async (tx) => {
      const connection = await tx.connection.create({
        data: {
          initiatorId: studentId,
          receiverId: mentorId,
          status: ConnectionStatus.CONNECTED,
          type: ConnectionType.SESSION_BOOKING,
          bookingId: bookingId || null,
        },
      });

      const conversation = await tx.conversation.create({
        data: {
          connectionId: connection.id,
          lastMessageText: "Session confirmed",
          lastMessageAt: new Date(),
          participants: {
            create: [
              { userId: studentId },
              { userId: mentorId },
            ],
          },
          messages: {
            create: {
              content: "Session confirmed",
              messageType: MessageType.SYSTEM,
              senderId: null,
            },
          },
        },
      });

      return conversation;
    });

    return createdConversation;
  }

  /**
   * Retrieves all conversations for the authenticated user, formatted with other participant info,
   * last message preview or placeholder, and unread count.
   */
  static async getUserConversations(userId: number): Promise<ConversationSummaryDto[]> {
    const participantRecords = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        isArchived: false,
      },
      include: {
        conversation: {
          include: {
            connection: true,
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          lastMessageAt: "desc",
        },
      },
    });

    const results: ConversationSummaryDto[] = [];

    for (const record of participantRecords) {
      const conv = record.conversation;
      const otherPart = conv.participants.find((p) => p.userId !== userId);
      const otherUser = otherPart?.user;

      if (!otherUser) {
        continue;
      }

      // Compute unread count (messages sent by others after this user's lastReadAt)
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          ...(record.lastReadAt ? { createdAt: { gt: record.lastReadAt } } : {}),
        },
      });

      const otherParticipantSummary: ParticipantSummary = {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        avatarUrl: otherUser.avatarUrl,
        role: otherUser.role,
      };

      results.push({
        id: conv.id,
        connectionId: conv.connectionId,
        connectionStatus: conv.connection?.status ?? ConnectionStatus.CONNECTED,
        otherParticipant: otherParticipantSummary,
        lastMessageText: conv.lastMessageText,
        lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
        unreadCount,
        createdAt: conv.createdAt.toISOString(),
      });
    }

    return results;
  }

  /**
   * Retrieves a specific conversation's detail for the authenticated user.
   */
  static async getConversationById(
    conversationId: number,
    userId: number
  ): Promise<ConversationSummaryDto> {
    const participantRecord = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      include: {
        conversation: {
          include: {
            connection: true,
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participantRecord) {
      throw new NotFoundError("Conversation not found or you are not a participant.");
    }

    const conv = participantRecord.conversation;
    const otherPart = conv.participants.find((p) => p.userId !== userId);
    const otherUser = otherPart?.user;

    if (!otherUser) {
      throw new NotFoundError("Other conversation participant not found.");
    }

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conv.id,
        senderId: { not: userId },
        ...(participantRecord.lastReadAt
          ? { createdAt: { gt: participantRecord.lastReadAt } }
          : {}),
      },
    });

    return {
      id: conv.id,
      connectionId: conv.connectionId,
      connectionStatus: conv.connection?.status ?? ConnectionStatus.CONNECTED,
      otherParticipant: {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        avatarUrl: otherUser.avatarUrl,
        role: otherUser.role,
      },
      lastMessageText: conv.lastMessageText,
      lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
      unreadCount,
      createdAt: conv.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves messages for a conversation, marks user's lastReadAt as now, and returns paginated list.
   */
  static async getConversationMessages(
    conversationId: number,
    userId: number,
    options: GetMessagesOptions = {}
  ): Promise<MessageDto[]> {
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!isParticipant) {
      throw new ForbiddenError("You are not a participant in this conversation.");
    }

    // Mark messages as read by updating caller's lastReadAt
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    const limit = options.limit || 50;

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(options.cursor ? { id: { lt: options.cursor } } : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
    });

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender?.name,
      senderAvatarUrl: m.sender?.avatarUrl,
      content: m.content,
      messageType: m.messageType,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      createdAt: m.createdAt.toISOString(),
      isMine: m.senderId === userId,
    }));
  }

  /**
   * Sends a message in a conversation and triggers an Expo push notification to the recipient.
   */
  static async sendMessage(
    conversationId: number,
    senderId: number,
    input: SendMessageInput
  ): Promise<MessageDto> {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderId,
        },
      },
      include: {
        conversation: {
          include: {
            connection: true,
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      throw new ForbiddenError("You are not a participant in this conversation.");
    }

    const connection = participant.conversation.connection;
    if (connection && connection.status === ConnectionStatus.BLOCKED) {
      throw new ForbiddenError("Cannot send messages because this connection is blocked.");
    }

    const now = new Date();
    const messageType = input.messageType || MessageType.TEXT;

    // Atomically save message, update conversation last message info, and update sender's lastReadAt
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content: input.content,
          messageType,
          fileUrl: input.fileUrl || null,
          fileName: input.fileName || null,
          fileSize: input.fileSize || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageText: input.content,
          lastMessageAt: now,
        },
      });

      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: senderId,
          },
        },
        data: {
          lastReadAt: now,
        },
      });

      return created;
    });

    // Notify other participant(s) via Push Notifications in background
    const senderName = message.sender?.name || "New message";
    const recipients = participant.conversation.participants.filter((p) => p.userId !== senderId);

    for (const recipient of recipients) {
      NotificationService.sendToUser(recipient.userId, {
        title: senderName,
        body: input.content,
        data: {
          route: `/messages/${conversationId}`,
          type: "CHAT_MESSAGE",
          conversationId,
          senderId,
        },
      }).catch((err) => {
        console.error(`[MessagesService] Failed to dispatch push notification to user ${recipient.userId}:`, err);
      });
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender?.name,
      senderAvatarUrl: message.sender?.avatarUrl,
      content: message.content,
      messageType: message.messageType,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      createdAt: message.createdAt.toISOString(),
      isMine: true,
    };
  }

  /**
   * Helper to resolve the conversation associated with a booking ID.
   */
  static async getConversationByBookingId(
    bookingId: number,
    userId: number
  ): Promise<{ conversationId: number } | null> {
    const booking = await prisma.sessionBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID ${bookingId} not found.`);
    }

    if (booking.studentId !== userId && booking.mentorId !== userId) {
      throw new ForbiddenError("You are not authorized to access this booking conversation.");
    }

    // Try finding existing connection for this booking or between the two users
    let connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { bookingId: booking.id },
          { initiatorId: booking.studentId, receiverId: booking.mentorId },
          { initiatorId: booking.mentorId, receiverId: booking.studentId },
        ],
      },
      include: {
        conversation: true,
      },
    });

    if (!connection || !connection.conversation) {
      // If booking is CONFIRMED, auto-ensure it
      if (booking.status === "CONFIRMED") {
        const conv = await this.ensureConnectionForBooking(
          booking.studentId,
          booking.mentorId,
          booking.id
        );
        return { conversationId: conv.id };
      }
      return null;
    }

    return { conversationId: connection.conversation.id };
  }
}
