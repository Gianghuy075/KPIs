import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import MainLayout from './layout/MainLayout';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/Feedback/ErrorBoundary';

const App = () => (
  <ConfigProvider
    locale={viVN}
    theme={{
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
      },
    }}
  >
    <AntApp>
      <BrowserRouter>
        <ErrorBoundary>
          <MainLayout>
            <AppRouter />
          </MainLayout>
        </ErrorBoundary>
      </BrowserRouter>
    </AntApp>
  </ConfigProvider>
);

export default App;
