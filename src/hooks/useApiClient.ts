import { useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export const useApiClient = () => {
  const get = useCallback(async <T>(path: string): Promise<T> => {
    const res = await apiClient.get<T>(path);
    return res.data;
  }, []);

  const post = useCallback(async <T, TBody = unknown>(path: string, body: TBody): Promise<T> => {
    const res = await apiClient.post<T>(path, body);
    return res.data;
  }, []);

  return { get, post };
};
