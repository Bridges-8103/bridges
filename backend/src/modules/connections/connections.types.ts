import type { ConnectionStatus, ConnectionType } from "@prisma/client";

export type { ConnectionStatus, ConnectionType };

export interface ConnectionUserSummary {
  id: number;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  avatarUrl?: string | null;
  bio?: string | null;
  headline?: string | null;
  university?: string | null;
  degree?: string | null;
  jobTitle?: string | null;
  company?: string | null;
}

export interface ConnectionDto {
  id: number;
  initiatorId: number;
  receiverId: number;
  status: ConnectionStatus;
  type: ConnectionType;
  bookingId?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  connectedUser: ConnectionUserSummary;
}

export type ConnectionRelationshipStatus =
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "CONNECTED"
  | "DECLINED"
  | "BLOCKED"
  | "SELF";

export interface ConnectionStatusResponse {
  status: ConnectionRelationshipStatus;
  connectionId?: number | null;
  isInitiator?: boolean;
  note?: string | null;
}

export interface CreateConnectionInput {
  receiverId: number;
  note?: string;
}

export interface UpdateConnectionStatusInput {
  status: "CONNECTED" | "DECLINED";
}

export interface ConnectionListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: "STUDENT" | "MENTOR";
}

export interface ConnectionListResponse {
  items: ConnectionDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConnectionRequestsResponse {
  incoming: ConnectionDto[];
  outgoing: ConnectionDto[];
}
