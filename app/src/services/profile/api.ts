import { api } from '@/services/api';
import { CreateProfileInput, UpdateProfileInput, UserProfile } from './types';

export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('/api/profile');
  return response.data;
};

export const createProfile = async (input: CreateProfileInput): Promise<UserProfile> => {
  const response = await api.post<UserProfile>('/api/profile', input);
  return response.data;
};

export const updateProfile = async (input: UpdateProfileInput): Promise<UserProfile> => {
  const response = await api.patch<UserProfile>('/api/profile', input);
  return response.data;
};
