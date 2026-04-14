import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import UserManagement from '../pages/admin/UserManagement';
import BranchManagement from '../pages/admin/BranchManagement';
// Phòng ban và trưởng phòng không còn dùng, tạm thời disable
// import DepartmentManagement from '../pages/admin/DepartmentManagement';
// import DepartmentManagers from '../pages/admin/DepartmentManagers';
import KPIManagement from '../pages/admin/KPIManagement';
import CompanyKPI from '../pages/admin/CompanyKPI';
import BSCWeightManagement from '../pages/admin/BSCWeightManagement';
import BranchKPI from '../pages/branch/BranchKPI';
import MyKPI from '../pages/employee/MyKPI';
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
  const { user, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return null;
  }

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
          {/* Giữ nguyên location đang đứng; chỉ redirect khi truy cập gốc */} 
          <Route path="/" element={<Navigate to={location.pathname === '/' ? '/dashboard' : location.pathname} replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Admin Routes - chỉ cho Executive */}
          {user?.role === 'senior_manager' && (
            <>
              <Route path="/admin/kpis-bsc" element={<CompanyKPI />} />
              <Route path="/admin/bsc-weights" element={<BSCWeightManagement />} />
              <Route path="/admin/employee" element={<UserManagement />} />
              <Route path="/admin/branches" element={<BranchManagement />} />
              {/* Phòng ban & trưởng phân xưởng đang tạm ẩn */}
              <Route path="/admin/notifications" element={<NotificationManagement />} />
              <Route path="/admin/kpi-management" element={<KPIManagement />} />
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
          {user?.role === 'branch_manager' && (
            <Route path="/branch/kpis" element={<BranchKPI />} />
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
