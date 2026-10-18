import React, { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionButton } from '@/components/common/connection-button';
import * as connectionApi from '@/services/connections/api';

jest.mock('@/services/connections/api');

const mockedApi = jest.mocked(connectionApi);

async function renderComponent(props: { targetUserId: string | number; targetUserName?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

  await render(<ConnectionButton {...props} />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('ConnectionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Connect button when relationship is NONE', async () => {
    mockedApi.getConnectionStatus.mockResolvedValueOnce({
      status: 'NONE',
    });

    await renderComponent({ targetUserId: 10, targetUserName: 'Alex Student' });

    expect(await screen.findByText('Connect')).toBeOnTheScreen();
  });

  it('renders Pending button when relationship is PENDING_SENT', async () => {
    mockedApi.getConnectionStatus.mockResolvedValueOnce({
      status: 'PENDING_SENT',
      connectionId: 101,
      isInitiator: true,
    });

    await renderComponent({ targetUserId: 10, targetUserName: 'Alex Student' });

    expect(await screen.findByText('Pending')).toBeOnTheScreen();
  });

  it('renders Accept and Decline buttons when relationship is PENDING_RECEIVED', async () => {
    mockedApi.getConnectionStatus.mockResolvedValueOnce({
      status: 'PENDING_RECEIVED',
      connectionId: 102,
      isInitiator: false,
    });

    await renderComponent({ targetUserId: 10, targetUserName: 'Alex Student' });

    expect(await screen.findByText('Accept')).toBeOnTheScreen();
    expect(screen.getByText('Decline')).toBeOnTheScreen();
  });

  it('renders Connected button when relationship is CONNECTED', async () => {
    mockedApi.getConnectionStatus.mockResolvedValueOnce({
      status: 'CONNECTED',
      connectionId: 103,
    });

    await renderComponent({ targetUserId: 10, targetUserName: 'Alex Student' });

    expect(await screen.findByText('Connected')).toBeOnTheScreen();
  });

  it('renders nothing when viewing SELF', async () => {
    mockedApi.getConnectionStatus.mockResolvedValueOnce({
      status: 'SELF',
    });

    await renderComponent({ targetUserId: 1, targetUserName: 'Current User' });

    expect(screen.queryByText('Connect')).toBeNull();
    expect(screen.queryByText('Connected')).toBeNull();
    expect(screen.queryByText('Pending')).toBeNull();
  });
});
