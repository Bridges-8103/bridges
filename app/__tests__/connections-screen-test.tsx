import React, { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConnectionsScreen from '@/app/connections';
import * as connectionsApi from '@/services/connections/api';
import * as expoRouter from 'expo-router';

jest.mock('@/services/connections/api');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
}));

const mockedConnectionsApi = jest.mocked(connectionsApi);
const mockedExpoRouter = jest.mocked(expoRouter);

async function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });

  await render(<>{ui}</>, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('ConnectionsScreen Tab Parameter Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectionsApi.getConnections.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    mockedConnectionsApi.getConnectionRequests.mockResolvedValue({
      incoming: [],
      outgoing: [],
    });
  });

  it('defaults to Connections tab when no tab parameter is passed', async () => {
    mockedExpoRouter.useLocalSearchParams.mockReturnValue({});

    await renderWithClient(<ConnectionsScreen />);

    expect(await screen.findByPlaceholderText('Search connections by name…')).toBeOnTheScreen();
    expect(screen.getByText('No connections yet')).toBeOnTheScreen();
  });

  it('switches to Invitations tab when tab=invitations is passed in params', async () => {
    mockedExpoRouter.useLocalSearchParams.mockReturnValue({ tab: 'invitations' });

    await renderWithClient(<ConnectionsScreen />);

    expect(await screen.findByText('Received Invitations (0)')).toBeOnTheScreen();
    expect(screen.getByText('Sent Invitations (0)')).toBeOnTheScreen();
  });
});
