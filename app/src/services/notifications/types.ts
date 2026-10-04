export interface RegisterPushTokenInput {
  token: string;
  platform?: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
}

export interface StoredPushToken {
  id: number;
  token: string;
  platform: string | null;
  isActive: boolean;
}

export interface UnregisterPushTokenInput {
  token: string;
}
