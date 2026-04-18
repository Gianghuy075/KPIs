import { useCallback, useEffect, useState } from 'react';
import workshopKpiService from '../services/workshopKpiService';
import penaltyService from '../services/penaltyService';

const EMPTY_ARRAY = [];

export const useWorkshopKpiMeta = ({ includeWorkshops = false, includePenaltyLogics = false } = {}) => {
  const [workshops, setWorkshops] = useState(EMPTY_ARRAY);
  const [bscCategories, setBscCategories] = useState(EMPTY_ARRAY);
  const [penaltyLogics, setPenaltyLogics] = useState(EMPTY_ARRAY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const requests = [
        workshopKpiService.listBscCategories(),
        includeWorkshops ? workshopKpiService.listWorkshops() : Promise.resolve([]),
        includePenaltyLogics ? penaltyService.list() : Promise.resolve([]),
      ];

      const [bsc, ws, penalty] = await Promise.all(requests);

      setBscCategories(Array.isArray(bsc) ? bsc : []);
      setWorkshops(Array.isArray(ws) ? ws : []);
      setPenaltyLogics(Array.isArray(penalty) ? penalty : []);
    } catch (err) {
      setError(err?.message || 'Không thể tải dữ liệu khởi tạo');
    } finally {
      setLoading(false);
    }
  }, [includePenaltyLogics, includeWorkshops]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    workshops,
    bscCategories,
    penaltyLogics,
    loading,
    error,
    reload: load,
  };
};
