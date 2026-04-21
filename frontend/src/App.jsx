import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import socketService from './services/socketService';
import MainLayout from './layouts/MainLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';

import Dashboard from './pages/Dashboard';
import MarketHubPage from './pages/MarketHubPage';
import TradePage from './pages/TradePage';
import PortfolioPage from './pages/PortfolioPage';
import WalletPage from './pages/WalletPage';
import WatchlistPage from './pages/WatchlistPage';
import ChatbotPage from './pages/ChatbotPage';
import AdvisorPage from './pages/AdvisorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BacktestPage from './pages/BacktestPage';
import AIPredictorPage from './pages/AIPredictorPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
        
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/trade" element={<MarketHubPage />} />
          <Route path="/trade/:symbol" element={<TradePage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/advisor" element={<AdvisorPage />} />
          <Route path="/predictor" element={<AIPredictorPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/backtest" element={<BacktestPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
