export type ConnectionStatus = "PENDING" | "CONNECTED" | "DECLINED" | "BLOCKED";
export type ConnectionType = "SESSION_BOOKING" | "DIRECT_REQUEST";

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

export interface Connection {
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
  items: Connection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConnectionRequestsResponse {
  incoming: Connection[];
  outgoing: Connection[];
}
