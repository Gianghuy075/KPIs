import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import UserManagement from '../pages/admin/UserManagement';
import BranchManagement from '../pages/admin/BranchManagement';
import DepartmentManagement from '../pages/admin/DepartmentManagement';
import DepartmentManagers from '../pages/admin/DepartmentManagers';
import KPIManagement from '../pages/admin/KPIManagement';
import KPIDashboards from '../pages/admin/KPIDashboards';
import DepartmentKPIDashboard from '../pages/admin/DepartmentKPIDashboard';
import NotificationManagement from '../pages/admin/NotificationManagement';
import MonthlyWorkManagement from '../pages/admin/MonthlyWorkManagement';
import QuarterlyWorkManagement from '../pages/admin/QuarterlyWorkManagement';
import YearlyWorkManagement from '../pages/admin/YearlyWorkManagement';
import KPIPenaltyRules from '../pages/admin/KPIPenaltyRules';
import PenaltyRulesByBSC from '../pages/admin/PenaltyRulesByBSC';
import DailyWorkManagement from '../pages/admin/DailyWorkManagement';
import DailyEvaluation from '../pages/admin/DailyEvaluation';
import MonthlyEvaluation from '../pages/admin/MonthlyEvaluation';
import YearlyEvaluation from '../pages/admin/YearlyEvaluation';

const AppRouter = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Nếu chưa đăng nhập, hiển thị Login */}
      {!user ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Admin Routes - chỉ cho Executive */}
          {user?.role === 'senior_manager' && (
            <>
              <Route path="/admin/employee" element={<UserManagement />} />
              <Route path="/admin/branches" element={<BranchManagement />} />
              <Route path="/admin/department-managers" element={<DepartmentManagers />} />
              <Route path="/admin/departments" element={<DepartmentManagement />} />
              <Route path="/admin/notifications" element={<NotificationManagement />} />
              <Route path="/admin/kpi-management" element={<KPIManagement />} />
              <Route path="/admin/kpi-dashboards" element={<KPIDashboards />} />
              <Route path="/admin/kpi-dashboards/:departmentId" element={<DepartmentKPIDashboard />} />
              <Route path="/admin/monthly-work" element={<MonthlyWorkManagement />} />
              <Route path="/admin/quarterly-work" element={<QuarterlyWorkManagement />} />
              <Route path="/admin/yearly-work" element={<YearlyWorkManagement />} />
              
              <Route path="/admin/penalty-rules" element={<KPIPenaltyRules />} />
              <Route path="/admin/penalty-rules-bsc" element={<PenaltyRulesByBSC />} />
              <Route path="/admin/daily-work" element={<DailyWorkManagement />} />
              <Route path="/admin/daily-evaluation" element={<DailyEvaluation />} />
              <Route path="/admin/monthly-evaluation" element={<MonthlyEvaluation />} />
              <Route path="/admin/yearly-evaluation" element={<YearlyEvaluation />} />
            </>
          )}
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
};

export default AppRouter;
