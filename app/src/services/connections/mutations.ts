import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  removeConnection,
  respondToConnectionRequest,
  sendConnectionRequest,
} from './api';
import { connectionKeys } from './keys';
import type {
  Connection,
  CreateConnectionInput,
} from './types';

export function useConnectMutation() {
  const queryClient = useQueryClient();

  return useMutation<Connection, Error, CreateConnectionInput>({
    mutationFn: sendConnectionRequest,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: connectionKeys.status(variables.receiverId),
        }),
        queryClient.invalidateQueries({
          queryKey: connectionKeys.requests(),
        }),
      ]);
    },
  });
}

export function useAcceptConnectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<Connection, Error, { connectionId: number; targetUserId?: string | number }>({
    mutationFn: ({ connectionId }) =>
      respondToConnectionRequest(connectionId, { status: 'CONNECTED' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: connectionKeys.all,
      });
    },
  });
}

export function useDeclineConnectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<Connection, Error, { connectionId: number; targetUserId?: string | number }>({
    mutationFn: ({ connectionId }) =>
      respondToConnectionRequest(connectionId, { status: 'DECLINED' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: connectionKeys.all,
      });
    },
  });
}

export function useRemoveConnectionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string },
    Error,
    { connectionId: number; targetUserId?: string | number }
  >({
    mutationFn: ({ connectionId }) => removeConnection(connectionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: connectionKeys.all,
      });
    },
  });
}
