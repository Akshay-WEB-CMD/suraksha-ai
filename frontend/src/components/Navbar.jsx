import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Sun, Moon, Map, AlertTriangle, Video, 
  Activity, HomeIcon, MonitorPlay, LogIn, LogOut, User, 
  ChevronDown, Settings, Bell
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/emergency-sos', label: 'SOS', icon: Activity, color: 'text-red-500' },
    { path: '/report-violation', label: 'Violations', icon: Video },
    { path: '/report-pothole', label: 'Potholes', icon: AlertTriangle },
    { path: '/dashboard', label: 'Live Map', icon: Map },
    { path: '/monitor', label: 'Monitor', icon: MonitorPlay },
    { path: '/police', label: 'Admin', icon: Shield },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass-morphism border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-800 dark:text-white group-hover:text-primary transition-colors">
            Namma <span className="text-primary">Suraksha AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all relative group ${
                location.pathname === link.path
                  ? 'text-primary bg-primary/5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-white'
              }`}
            >
              <link.icon className={`w-4 h-4 ${link.color || ''}`} />
              <span>{link.label}</span>
              {location.pathname === link.path && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="h-6 w-px bg-slate-200 dark:border-slate-800 mx-2 hidden sm:block" />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Officer</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[80px]">
                    {user.email.split('@')[0]}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-lg">
                  <User className="w-5 h-5" />
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-3 w-56 glass-morphism bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">User Context</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-all">
                        <Settings className="w-4 h-4" /> Account Settings
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-all text-red-500">
                        <Bell className="w-4 h-4" /> Notifications
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all mt-1"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Nav Link Indicator (Bottom Bar) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-morphism border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl px-2 py-1 flex items-center justify-around z-50 rounded-t-3xl">
        {navLinks.slice(0, 5).map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex flex-col items-center p-2 rounded-2xl transition-all ${
              location.pathname === link.path ? 'text-primary' : 'text-slate-400'
            }`}
          >
            <link.icon className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-black uppercase tracking-tighter">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
