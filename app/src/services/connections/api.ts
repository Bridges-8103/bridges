import { api } from '@/services/api';
import type { ApiEnvelope } from '@/services/profile/types';
import type {
  Connection,
  ConnectionListQuery,
  ConnectionListResponse,
  ConnectionRequestsResponse,
  ConnectionStatusResponse,
  CreateConnectionInput,
  UpdateConnectionStatusInput,
} from './types';

/**
 * Fetch relationship status between current user and target user
 */
export const getConnectionStatus = async (
  targetUserId: string | number
): Promise<ConnectionStatusResponse> => {
  const response = await api.get<ApiEnvelope<ConnectionStatusResponse>>(
    `/api/connections/status/${targetUserId}`
  );
  return response.data?.data ?? { status: 'NONE' };
};

/**
 * Fetch paginated list of active connections
 */
export const getConnections = async (
  query?: ConnectionListQuery
): Promise<ConnectionListResponse> => {
  const response = await api.get<ApiEnvelope<ConnectionListResponse>>('/api/connections', {
    params: query,
  });
  return (
    response.data?.data ?? {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    }
  );
};

/**
 * Fetch incoming and outgoing connection requests
 */
export const getConnectionRequests = async (): Promise<ConnectionRequestsResponse> => {
  const response = await api.get<ApiEnvelope<ConnectionRequestsResponse>>(
    '/api/connections/requests'
  );
  return response.data?.data ?? { incoming: [], outgoing: [] };
};

/**
 * Send a connection request to a student or mentor
 */
export const sendConnectionRequest = async (
  input: CreateConnectionInput
): Promise<Connection> => {
  const response = await api.post<ApiEnvelope<Connection>>('/api/connections', input);
  if (!response.data?.data) {
    throw new Error(response.data?.message || 'Failed to send connection request.');
  }
  return response.data.data;
};

/**
 * Accept or decline an incoming connection request
 */
export const respondToConnectionRequest = async (
  connectionId: number,
  input: UpdateConnectionStatusInput
): Promise<Connection> => {
  const response = await api.patch<ApiEnvelope<Connection>>(
    `/api/connections/${connectionId}`,
    input
  );
  if (!response.data?.data) {
    throw new Error(response.data?.message || 'Failed to update connection request.');
  }
  return response.data.data;
};

/**
 * Remove a mutual connection or cancel a pending request
 */
export const removeConnection = async (
  connectionId: number
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<ApiEnvelope<{ success: boolean; message: string }>>(
    `/api/connections/${connectionId}`
  );
  return response.data?.data ?? { success: true, message: 'Removed successfully.' };
};
