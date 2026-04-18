import { useCallback, useEffect, useState } from 'react';
import workshopKpiService from '../services/workshopKpiService';
import penaltyService from '../services/penaltyService';
import type { ApiBscCategory, ApiPenaltyLogic, ApiWorkshop } from '../types/api';

const EMPTY_WORKSHOPS: ApiWorkshop[] = [];
const EMPTY_BSC_CATEGORIES: ApiBscCategory[] = [];
const EMPTY_PENALTY_LOGICS: ApiPenaltyLogic[] = [];

type MetaOptions = {
  includeWorkshops?: boolean;
  includePenaltyLogics?: boolean;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const useWorkshopKpiMeta = ({
  includeWorkshops = false,
  includePenaltyLogics = false,
}: MetaOptions = {}) => {
  const [workshops, setWorkshops] = useState<ApiWorkshop[]>(EMPTY_WORKSHOPS);
  const [bscCategories, setBscCategories] = useState<ApiBscCategory[]>(EMPTY_BSC_CATEGORIES);
  const [penaltyLogics, setPenaltyLogics] = useState<ApiPenaltyLogic[]>(EMPTY_PENALTY_LOGICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const bscPromise = workshopKpiService.listBscCategories();
      const workshopPromise: Promise<ApiWorkshop[]> = includeWorkshops
        ? workshopKpiService.listWorkshops()
        : Promise.resolve([]);
      const penaltyPromise: Promise<ApiPenaltyLogic[]> = includePenaltyLogics
        ? penaltyService.list()
        : Promise.resolve([]);

      const [bsc, ws, penalty] = await Promise.all([
        bscPromise,
        workshopPromise,
        penaltyPromise,
      ]);

      setBscCategories(Array.isArray(bsc) ? bsc : []);
      setWorkshops(Array.isArray(ws) ? ws : []);
      setPenaltyLogics(Array.isArray(penalty) ? penalty : []);
    } catch (errorValue) {
      setError(getErrorMessage(errorValue, 'Không thể tải dữ liệu khởi tạo'));
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
