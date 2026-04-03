import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { kpiService } from '../services/kpiService';

export const useKPIActions = () => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await kpiService.getAll();
      setKpis(data);
    } catch (err) {
      setError(err.message);
      message.error('Không thể tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  const addKPI = useCallback(async (kpiData) => {
    setLoading(true);
    try {
      await kpiService.create(kpiData);
      await fetchKPIs();
      message.success('Thêm KPI thành công');
      return true;
    } catch (err) {
      message.error('Không thể thêm KPI: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchKPIs]);

  const updateKPI = useCallback(async (id, updates) => {
    setLoading(true);
    try {
      await kpiService.update(id, updates);
      await fetchKPIs();
      message.success('Cập nhật KPI thành công');
      return true;
    } catch (err) {
      message.error('Không thể cập nhật KPI: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchKPIs]);

  const deleteKPI = useCallback(async (id) => {
    setLoading(true);
    try {
      await kpiService.delete(id);
      await fetchKPIs();
      message.success('Xóa KPI thành công');
      return true;
    } catch (err) {
      message.error('Không thể xóa KPI: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchKPIs]);

  return {
    kpis,
    loading,
    error,
    fetchKPIs,
    addKPI,
    updateKPI,
    deleteKPI,
  };
};
