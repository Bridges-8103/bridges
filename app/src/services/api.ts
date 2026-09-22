import axios from 'axios';

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export default api;
