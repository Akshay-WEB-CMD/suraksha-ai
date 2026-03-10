import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Car, HelpCircle, ArrowRight, Map, Activity, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ title, description, icon: Icon, to, highlightTheme }) => {
  const isDanger = highlightTheme === 'danger';
  const themeColors = isDanger 
    ? 'bg-danger/10 text-danger border-danger/20 hover:border-danger/50' 
    : 'bg-primary/10 text-primary border-primary/20 hover:border-primary/50';

  const buttonClass = isDanger
    ? 'bg-danger text-white hover:bg-danger-dark'
    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary';

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass-morphism p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden relative group transition-colors`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${themeColors}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white tracking-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">{description}</p>
      <Link 
        to={to} 
        className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${buttonClass}`}
      >
        <span>Open</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
};

const Home = () => {
  return (
    <div className="hero-gradient min-h-[calc(100vh-4rem)] relative overflow-hidden pb-24 lg:pb-0">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-20 lg:pt-32 pb-16 text-center relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 mb-6 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-fast"></span>
            <span>Smart City Safety Network</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter leading-[1.1] text-slate-900 dark:text-white">
            Namma <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">Suraksha</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Empowering citizens to report hazards and violations instantly. Next-generation civic safety powered by AI and community action.
          </p>
          
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard 
            title="Report Violation" 
            description="Submit AI-assisted reports for signal jumping, helmetless riding, and parking issues."
            icon={Video}
            to="/report-violation"
            highlightTheme="primary"
          />
          <FeatureCard 
            title="Report Pothole" 
            description="Log dangerous road conditions to be verified and resolved by city officials."
            icon={Car}
            to="/report-pothole"
            highlightTheme="primary"
          />
          <FeatureCard 
            title="Emergency SOS" 
            description="Instantly alert authorities with your GPS location and emergency details."
            icon={Activity}
            to="/emergency-sos"
            highlightTheme="danger"
          />
          <FeatureCard 
            title="Live Map" 
            description="View real-time safety reports, hazard zones, and active incidents across the city."
            icon={Map}
            to="/dashboard"
            highlightTheme="primary"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
