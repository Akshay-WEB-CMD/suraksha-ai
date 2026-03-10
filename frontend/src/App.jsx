import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import TrafficChatbot from './components/TrafficChatbot';
import Home from './pages/Home';
import ReportViolation from './pages/ReportViolation';
import ReportPothole from './pages/ReportPothole';
import EmergencySOS from './pages/EmergencySOS';
import Dashboard from './pages/Dashboard';
import PoliceDashboard from './pages/PoliceDashboard';
import LiveMonitor from './pages/LiveMonitor';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.02, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  if (requireAdmin && user.email !== 'admin@suraksha.ai') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/report-violation" element={<ProtectedRoute><PageTransition><ReportViolation /></PageTransition></ProtectedRoute>} />
        <Route path="/report-pothole" element={<ProtectedRoute><PageTransition><ReportPothole /></PageTransition></ProtectedRoute>} />
        <Route path="/emergency-sos" element={<PageTransition><EmergencySOS /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/police" element={<ProtectedRoute requireAdmin={true}><PageTransition><PoliceDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/monitor" element={<ProtectedRoute><PageTransition><LiveMonitor /></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <Navbar />
          <main>
            <AnimatedRoutes />
          </main>
          <TrafficChatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
