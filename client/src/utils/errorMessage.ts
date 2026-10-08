import axios from 'axios';

export const errorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || error.message || fallback;
  return error instanceof Error ? error.message : fallback;
};
