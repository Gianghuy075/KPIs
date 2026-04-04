import { useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export const useApiClient = () => {
  const get = useCallback(async (path) => {
    const res = await apiClient.get(path);
    return res.data;
  }, []);

  const post = useCallback(async (path, body) => {
    const res = await apiClient.post(path, body);
    return res.data;
  }, []);

  return { get, post };
};
