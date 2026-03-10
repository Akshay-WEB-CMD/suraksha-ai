import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, CheckCircle, XCircle, Search, Filter, MoreVertical, FileText, Image as ImageIcon, Navigation, MapPin } from 'lucide-react';

const MOCK_REPORTS = [
  { _id: 'REP-001', title: 'Triple Riding Without Helmet', type: 'Violation', severity: 'High', status: 'Pending', location: { address: 'MG Road Junction' }, createdAt: new Date().toISOString(), evidence: { url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=200' }, vehicleDetails: { plateNumber: 'KA01AB1234' }, description: 'Three individuals detected on a single two-wheeler. None wearing helmets.' },
  { _id: 'REP-002', title: 'Deep Pothole', type: 'Pothole', severity: 'Medium', status: 'Verified', location: { address: 'Richmond Circle' }, createdAt: new Date(Date.now() - 3600000).toISOString(), evidence: { url: null } },
  { _id: 'REP-003', title: 'Emergency SOS', type: 'SOS', severity: 'Critical', status: 'Pending', location: { address: 'Koramangala 80ft Road' }, createdAt: new Date().toISOString(), evidence: { url: null }, description: 'User triggered silent SOS alert. GPS actively tracking.' },
  { _id: 'REP-004', title: 'Signal Jumping', type: 'Violation', severity: 'High', status: 'Resolved', location: { address: 'Jayanagar 4th Block' }, createdAt: new Date(Date.now() - 86400000).toISOString(), evidence: { url: 'https://images.unsplash.com/photo-1627042633145-b780d842bacb?auto=format&fit=crop&q=80&w=200' }, vehicleDetails: { plateNumber: 'KA05CD5678' } },
];

const PoliceDashboard = () => {
  const [filter, setFilter] = useState('All');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching
    setTimeout(() => {
      setReports(MOCK_REPORTS);
      setLoading(false);
    }, 800);
  }, []);

  const handleStatusUpdate = (id, status) => {
    setReports(reports.map(r => r._id === id ? { ...r, status } : r));
    if (selectedReport?._id === id) {
      setSelectedReport(prev => ({ ...prev, status }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-orange bg-orange/10 border border-orange/20'; // Safety Orange
      case 'Verified': return 'text-primary bg-primary/10 border border-primary/20'; // Electric Blue
      case 'Resolved': return 'text-green-500 bg-green-500/10 border border-green-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border border-slate-500/20';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      case 'High': return 'bg-orange shadow-[0_0_8px_rgba(249,115,22,0.5)]';
      case 'Medium': return 'bg-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]';
      default: return 'bg-slate-400';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 relative overflow-hidden pb-12">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black flex items-center space-x-3 tracking-tight text-slate-900 dark:text-white">
              <Shield className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Authoritative hub for City Safety Management</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-12 pr-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 shadow-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          {[
            { label: 'Pending', val: reports.filter(r => r.status === 'Pending').length, theme: 'orange' },
            { label: 'Critical SOS', val: reports.filter(r => r.severity === 'Critical').length, theme: 'danger' },
            { label: 'Verified', val: reports.filter(r => r.status === 'Verified').length, theme: 'primary' },
            { label: 'Resolution Rate', val: '94%', theme: 'accent' }
          ].map((stat, i) => (
            <div key={i} className="glass-morphism p-5 rounded-2xl border border-slate-200/50 dark:border-white/10 relative overflow-hidden group">
              <div className={`text-xs text-slate-500 font-bold uppercase tracking-wider mb-2`}>{stat.label}</div>
              <div className={`text-3xl font-black text-${stat.theme} dark:text-white`}>{stat.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Reports Table View */}
          <div className="xl:col-span-2 glass-morphism rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-xl flex flex-col h-[600px]">
             <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-slate-100/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Evidence</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Incident</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {reports.map((report) => (
                    <tr 
                      key={report._id}
                      onClick={() => setSelectedReport(report)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
                        selectedReport?._id === report._id ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">
                           {report.evidence?.url ? (
                            <img src={report.evidence.url} className="w-full h-full object-cover" alt="Thumb" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                          <div className={`absolute top-0 right-0 w-2 h-2 m-1 rounded-full ${getSeverityColor(report.severity)}`} />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{report.title}</div>
                        <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                           <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                           <span className="truncate max-w-[150px]">{report.location?.address}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-[11px] text-slate-500 font-medium">
                        {new Date(report.createdAt).toLocaleDateString()}<br/>
                        {new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>

          {/* Report Details Side Panel */}
          <div className="xl:col-start-3 relative h-[600px]">
            <AnimatePresence mode="wait">
              {selectedReport ? (
                <motion.div
                  key={selectedReport._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass-morphism p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl h-full flex flex-col overflow-y-auto custom-scrollbar relative"
                >
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Incident Details</h2>
                    <button onClick={() => setSelectedReport(null)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-full transition-all">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 mb-6 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                    {selectedReport.evidence?.url ? (
                      <>
                        <img src={selectedReport.evidence.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Large Evidence" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button className="px-4 py-2 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-lg uppercase tracking-wider border border-white/30">View Full Source</button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No visual data uploaded</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Type</label>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedReport.type}</div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Severity</label>
                        <div className={`text-sm font-bold uppercase ${selectedReport.severity === 'Critical' ? 'text-danger' : 'text-orange'}`}>{selectedReport.severity}</div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Location</label>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start">
                        <Navigation className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedReport.location?.address}</span>
                      </div>
                    </div>

                    {selectedReport.description && (
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Description / AI Summary</label>
                         <p className="text-xs text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                           {selectedReport.description}
                         </p>
                       </div>
                    )}

                    {selectedReport.vehicleDetails?.plateNumber && (
                      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Vehicle Identification</label>
                        <div className="p-4 bg-slate-950 rounded-xl border border-primary/30 flex items-center justify-between">
                          <div className="text-white font-mono text-xl font-bold tracking-widest">
                            {selectedReport.vehicleDetails.plateNumber}
                          </div>
                          <span className="text-[9px] text-green-400 font-bold px-2 py-0.5 bg-green-400/10 rounded-md border border-green-400/20 uppercase tracking-wider">High Conf.</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleStatusUpdate(selectedReport._id, 'Verified')}
                        disabled={selectedReport.status === 'Verified'}
                        className="py-3 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Verify
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedReport._id, 'Resolved')}
                        disabled={selectedReport.status === 'Resolved'}
                        className="py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> Resolve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Eye className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 mb-1">Select a Report</h3>
                  <p className="text-xs text-slate-500 max-w-[200px]">Click on any row in the table to view the detailed analysis here.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;
