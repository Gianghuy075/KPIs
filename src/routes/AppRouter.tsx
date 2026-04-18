import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import UserManagement from '../pages/admin/UserManagement';
import BranchManagement from '../pages/admin/BranchManagement';
import WorkshopDataEntry from '../pages/branch/WorkshopDataEntry';
import MonthlyScores from '../pages/branch/MonthlyScores';
import MyKPI from '../pages/employee/MyKPI';
import NotificationManagement from '../pages/admin/NotificationManagement';
import KPIPenaltyRules from '../pages/admin/KPIPenaltyRules';
import WorkshopKpis from '../pages/admin/WorkshopKpis';
import BonusConfigs from '../pages/admin/BonusConfigs';
import WorkshopKpiView from '../pages/admin/WorkshopKpiView';
import AdminMonthlyScores from '../pages/admin/AdminMonthlyScores';
import BranchKpiView from '../pages/branch/BranchKpiView';

const AppRouter = () => {
  const { user, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return null;
  }

  return (
    <Routes>
      {!user ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Navigate to={location.pathname === '/' ? '/dashboard' : location.pathname} replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {user?.role === 'system_admin' && (
            <>
              <Route path="/admin/employee" element={<UserManagement />} />
              <Route path="/admin/branches" element={<BranchManagement />} />
              <Route path="/admin/notifications" element={<NotificationManagement />} />
              <Route path="/admin/workshop-kpis" element={<WorkshopKpis />} />
              <Route path="/admin/workshop-kpi-view" element={<WorkshopKpiView />} />
              <Route path="/admin/bonus-configs" element={<BonusConfigs />} />
              <Route path="/admin/penalty-rules" element={<KPIPenaltyRules />} />
              <Route path="/admin/monthly-scores-view" element={<AdminMonthlyScores />} />
            </>
          )}
          {user?.role === 'workshop_manager' && (
            <>
              <Route path="/branch/data-entry" element={<WorkshopDataEntry />} />
              <Route path="/branch/monthly-scores" element={<MonthlyScores />} />
              <Route path="/branch/kpi-view" element={<BranchKpiView />} />
            </>
          )}
          {user?.role === 'employee' && (
            <Route path="/me/kpis" element={<MyKPI />} />
          )}

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
};

export default AppRouter;
