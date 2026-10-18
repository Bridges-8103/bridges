import { prisma } from "@/lib/prisma";
import { BookingStatus, type Prisma } from "@prisma/client";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { NotificationService } from "@/modules/notifications";
import type { ChatParticipantDto, ConversationDto, MessageDto } from "./messaging.types";

/** Booking states that unlock chat between a mentor and a student. */
const CHAT_ELIGIBLE_STATUSES = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

const PARTICIPANT_INCLUDE = { mentorDetail: true, studentDetail: true } as const;

type ParticipantUser = Prisma.UserGetPayload<{ include: typeof PARTICIPANT_INCLUDE }>;

export class MessagingService {
  /**
   * Chat is only allowed between a mentor and a student who share a confirmed/completed booking.
   */
  private static async hasEligibleBooking(mentorId: number, studentId: number): Promise<boolean> {
    const count = await prisma.sessionBooking.count({
      where: { mentorId, studentId, status: { in: CHAT_ELIGIBLE_STATUSES } },
    });
    return count > 0;
  }

  private static toParticipant(user: ParticipantUser): ChatParticipantDto {
    const subtitle =
      user.role === "MENTOR"
        ? user.mentorDetail?.jobTitle
          ? `${user.mentorDetail.jobTitle}${user.mentorDetail.company ? ` @ ${user.mentorDetail.company}` : ""}`
          : null
        : user.studentDetail?.university ?? null;

    return {
      id: String(user.id),
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      subtitle,
    };
  }

  private static toMessageDto(
    m: { id: number; conversationId: number; senderId: number; body: string; createdAt: Date },
    actorId: number
  ): MessageDto {
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderId: String(m.senderId),
      body: m.body,
      isMine: m.senderId === actorId,
      createdAt: m.createdAt.toISOString(),
    };
  }

  private static readAtField(conversation: { mentorId: number }, actorId: number) {
    return conversation.mentorId === actorId ? "mentorLastReadAt" : "studentLastReadAt";
  }

  /**
   * Loads a conversation and verifies the actor is a participant.
   */
  private static async getParticipantConversation(conversationId: number, actorId: number) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundError(`Conversation with ID ${conversationId} not found.`);
    }
    if (conversation.mentorId !== actorId && conversation.studentId !== actorId) {
      throw new ForbiddenError("You are not a participant in this conversation.");
    }
    return conversation;
  }

  /**
   * Lists the user's conversations. Pairs with a confirmed/completed booking get a conversation
   * created on demand, so every chat-eligible partner shows up even before the first message.
   */
  static async listConversations(userId: number): Promise<ConversationDto[]> {
    const pairs = await prisma.sessionBooking.findMany({
      where: {
        status: { in: CHAT_ELIGIBLE_STATUSES },
        OR: [{ mentorId: userId }, { studentId: userId }],
      },
      select: { mentorId: true, studentId: true },
      distinct: ["mentorId", "studentId"],
    });

    if (pairs.length === 0) return [];

    await prisma.conversation.createMany({
      data: pairs,
      skipDuplicates: true,
    });

    const conversations = await prisma.conversation.findMany({
      where: { OR: pairs },
      include: {
        mentor: { include: PARTICIPANT_INCLUDE },
        student: { include: PARTICIPANT_INCLUDE },
        messages: { orderBy: { id: "desc" }, take: 1 },
      },
    });

    const dtos = await Promise.all(
      conversations.map(async (c): Promise<ConversationDto> => {
        const isMentor = c.mentorId === userId;
        const lastReadAt = isMentor ? c.mentorLastReadAt : c.studentLastReadAt;
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });
        const last = c.messages[0];

        return {
          id: c.id,
          participant: this.toParticipant(isMentor ? c.student : c.mentor),
          lastMessage: last
            ? { body: last.body, createdAt: last.createdAt.toISOString(), isMine: last.senderId === userId }
            : null,
          lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
          unreadCount,
        };
      })
    );

    // Most recent activity first; conversations without messages go last
    return dtos.sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
  }

  /**
   * Gets (or creates) the conversation between the actor and another user.
   */
  static async getOrCreateConversation(actorId: number, participantId: number): Promise<ConversationDto> {
    if (actorId === participantId) {
      throw new BadRequestError("You cannot start a conversation with yourself.");
    }

    const [actor, other] = await Promise.all([
      prisma.user.findUnique({ where: { id: actorId } }),
      prisma.user.findUnique({ where: { id: participantId } }),
    ]);
    if (!actor || !other) throw new NotFoundError(`User with ID ${participantId} not found.`);

    const isPair =
      (actor.role === "MENTOR" && other.role === "STUDENT") ||
      (actor.role === "STUDENT" && other.role === "MENTOR");
    if (!isPair) {
      throw new ForbiddenError("Conversations are only available between a mentor and a student.");
    }

    const mentorId = actor.role === "MENTOR" ? actorId : participantId;
    const studentId = actor.role === "MENTOR" ? participantId : actorId;

    if (!(await this.hasEligibleBooking(mentorId, studentId))) {
      throw new ForbiddenError("You can chat once a session between you has been confirmed.");
    }

    const conversation = await prisma.conversation.upsert({
      where: { mentorId_studentId: { mentorId, studentId } },
      create: { mentorId, studentId },
      update: {},
    });

    return this.getConversation(conversation.id, actorId);
  }

  /**
   * Returns the conversation summary (other participant) for the chat header.
   */
  static async getConversation(conversationId: number, actorId: number): Promise<ConversationDto> {
    await this.getParticipantConversation(conversationId, actorId);

    const c = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: {
        mentor: { include: PARTICIPANT_INCLUDE },
        student: { include: PARTICIPANT_INCLUDE },
        messages: { orderBy: { id: "desc" }, take: 1 },
      },
    });

    const isMentor = c.mentorId === actorId;
    const lastReadAt = isMentor ? c.mentorLastReadAt : c.studentLastReadAt;
    const unreadCount = await prisma.message.count({
      where: {
        conversationId,
        senderId: { not: actorId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
    const last = c.messages[0];

    return {
      id: c.id,
      participant: this.toParticipant(isMentor ? c.student : c.mentor),
      lastMessage: last
        ? { body: last.body, createdAt: last.createdAt.toISOString(), isMine: last.senderId === actorId }
        : null,
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
      unreadCount,
    };
  }

  /**
   * Returns messages in chronological order. With `after`, only newer messages are returned
   * (used by polling). Fetching marks the conversation as read for the actor.
   */
  static async listMessages(
    conversationId: number,
    actorId: number,
    opts: { after?: number; limit: number }
  ): Promise<MessageDto[]> {
    const conversation = await this.getParticipantConversation(conversationId, actorId);

    const rows =
      opts.after !== undefined
        ? await prisma.message.findMany({
            where: { conversationId, id: { gt: opts.after } },
            orderBy: { id: "asc" },
            take: opts.limit,
          })
        : (
            await prisma.message.findMany({
              where: { conversationId },
              orderBy: { id: "desc" },
              take: opts.limit,
            })
          ).reverse();

    // Only touch the DB when the other participant has sent something
    if (rows.some((m) => m.senderId !== actorId)) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { [this.readAtField(conversation, actorId)]: new Date() },
      });
    }

    return rows.map((m) => this.toMessageDto(m, actorId));
  }

  /**
   * Sends a message and notifies the other participant via push.
   */
  static async sendMessage(conversationId: number, senderId: number, body: string): Promise<MessageDto> {
    const conversation = await this.getParticipantConversation(conversationId, senderId);

    if (!(await this.hasEligibleBooking(conversation.mentorId, conversation.studentId))) {
      throw new ForbiddenError("Messaging is unavailable because there is no confirmed session between you.");
    }

    const recipientId = conversation.mentorId === senderId ? conversation.studentId : conversation.mentorId;

    const message = await prisma.message.create({
      data: { conversationId, senderId, body },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: message.createdAt,
        // Sending implies the sender has read everything up to now
        [this.readAtField(conversation, senderId)]: message.createdAt,
      },
    });

    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });

    // Push is best-effort; never fail the send because of it
    try {
      await NotificationService.sendToUser(recipientId, {
        title: sender?.name ?? "New message",
        body: body.length > 140 ? `${body.slice(0, 137)}...` : body,
        data: { route: `/chat/${conversationId}` },
      });
    } catch (err) {
      console.error("[MessagingService] Failed to send push notification:", err);
    }

    return this.toMessageDto(message, senderId);
  }
}
