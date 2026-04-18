import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { kpiService, validateTotalWeight } from '../services/kpiService';

export const useDepartmentKPI = (departmentId) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchKPIs = useCallback(async () => {
    if (!departmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await kpiService.getDepartmentKPIs(departmentId);
      setKpis(data || []);
    } catch (err) {
      setError(err.message);
      message.error('Không thể tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  const addKPI = useCallback(async (kpiData) => {
    setLoading(true);
    try {
      // Validate total weight
      const validation = validateTotalWeight([...kpis, kpiData]);
      if (!validation.isValid) {
        message.error(validation.message);
        return false;
      }

      await kpiService.addDepartmentKPI(departmentId, kpiData);
      await fetchKPIs();
      message.success('Thêm KPI thành công');
      return true;
    } catch (err) {
      message.error('Không thể thêm KPI: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [departmentId, kpis, fetchKPIs]);

  const updateKPI = useCallback(async (kpiId, updates) => {
    setLoading(true);
    try {
      // Validate total weight
      const kpisForValidation = kpis.filter(k => k.id !== kpiId);
      const validation = validateTotalWeight([...kpisForValidation, updates]);
      if (!validation.isValid) {
        message.error(validation.message);
        return false;
      }

      await kpiService.updateDepartmentKPI(departmentId, kpiId, updates);
      await fetchKPIs();
      message.success('Cập nhật KPI thành công');
      return true;
    } catch (err) {
      message.error('Không thể cập nhật KPI: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [departmentId, kpis, fetchKPIs]);

  const deleteKPI = useCallback(async (kpiId) => {
    setLoading(true);
    try {
      await kpiService.deleteDepartmentKPI(departmentId, kpiId);
      await fetchKPIs();
      message.success('Xóa KPI thành công');
      return true;
    } catch (err) {
      message.error('Không thể xóa KPI: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [departmentId, fetchKPIs]);

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
