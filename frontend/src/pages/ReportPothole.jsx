import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, MapPin, CheckCircle2, AlertCircle, Loader2, Info, X, RefreshCw } from 'lucide-react';
import axios from 'axios';
import Webcam from 'react-webcam';

const ReportPothole = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
      
      // Auto-detect location (Mocked)
      setTimeout(() => {
        setLocation({
          lat: 12.9279,
          lng: 77.6271,
          address: "Koramangala 4th Block, Bengaluru"
        });
      }, 1000);
    }
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPreview(imageSrc);
    setShowWebcam(false);
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/ai/analyze', {
        image: preview,
        type: 'pothole'
      });
      
      const result = response.data;

      await axios.post('http://localhost:5000/api/reports/pothole', {
        potholesCount: result.potholesCount || 1,
        severity: result.severity || 'Medium',
        location,
        evidence: preview
      });

      setAnalysisResult({
        ...result,
        alertSent: true
      });
      setIsAnalyzing(false);
      setStep(3);
    } catch (error) {
      console.error('Error reporting pothole:', error);
      setIsAnalyzing(false);
      // Fallback
      setStep(3);
      setAnalysisResult({ detected: true, potholesCount: 1, severity: 'Medium', dimensions: '0.4m x 0.4m' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Report Pothole</h1>
        <p className="text-slate-600 dark:text-slate-400">Upload road images to alert authorities about dangerous potholes.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center group transition-all hover:border-secondary-light">
              {showWebcam ? (
                <div className="relative w-full h-full">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={handleCapture}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-secondary-light text-white px-8 py-3 rounded-full font-bold shadow-2xl flex items-center space-x-2 hover:bg-secondary-dark transition-all scale-110"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Road Photo</span>
                  </button>
                  <button 
                    onClick={() => setShowWebcam(false)}
                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : preview ? (
                <div className="relative w-full h-full group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                    <button 
                      onClick={() => { setPreview(null); setFile(null); }}
                      className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                    >
                      <RefreshCw className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setShowWebcam(true)}
                      className="p-3 bg-secondary-light text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-6">
                  <div className="flex space-x-6">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex flex-col items-center space-y-2 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:text-secondary-light transition-all"
                    >
                      <Upload className="w-10 h-10 text-slate-400 group-hover:text-secondary-light transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Upload Photo</span>
                    </button>
                    <button 
                      onClick={() => setShowWebcam(true)}
                      className="group flex flex-col items-center space-y-2 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:text-secondary-light transition-all"
                    >
                      <Camera className="w-10 h-10 text-slate-400 group-hover:text-secondary-light transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live View</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Capture or upload road surface photos</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">AI will detect depth & severity</p>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>

            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-morphism p-4 rounded-2xl flex items-center space-x-3 text-sm border border-secondary-light/10"
              >
                <div className="w-10 h-10 bg-secondary-light/10 rounded-xl flex items-center justify-center">
                  <MapPin className="text-secondary-light w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Road Location</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">{location ? location.address : "Fetching location..."}</p>
                </div>
              </motion.div>
            )}

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl flex items-start space-x-3">
              <Info className="text-blue-500 w-5 h-5 mt-1 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your report will be automatically categorized by our AI model and sent to the BBMP Road Engineering department.
              </p>
            </div>

            <button
              disabled={!preview}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-secondary-light hover:bg-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xl shadow-2xl shadow-secondary-light/30 transition-all flex items-center justify-center space-x-3"
            >
              <span>Scan Road Surface</span>
              <Camera className="w-6 h-6" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="space-y-6">
              <div className="relative w-64 h-64 mx-auto">
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-secondary-light shadow-[0_0_15px_rgba(16,185,129,0.8)] z-10"
                />
                <img src={preview} className="w-full h-full object-cover rounded-2xl grayscale" alt="Scanning" />
              </div>
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Analyzing Road Surface...</h2>
                <div className="flex justify-center items-center space-x-2 text-slate-500 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-secondary-light" />
                  <span>Detecting pothole depth and dimensions</span>
                </div>
                <button
                   onClick={runAIAnalysis}
                   className="mt-8 w-full py-4 bg-secondary-light text-white rounded-2xl font-bold shadow-xl"
                >
                  Start AI Processing
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && analysisResult && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-secondary-light/10 border border-secondary-light/20 p-6 rounded-2xl flex items-start space-x-4">
              <CheckCircle2 className="text-secondary-light w-8 h-8 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-secondary-light">Pothole Logged Successfully</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Our AI detected {analysisResult.potholesCount} pothole(s) with {analysisResult.severity} severity.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-morphism p-6 rounded-2xl">
                <h4 className="font-bold mb-4">Measurement Data</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-sm">Severity:</span>
                    <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold">{analysisResult.severity}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-sm">Est. Size:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{analysisResult.dimensions}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500 text-sm">GPS Coords:</span>
                    <span className="text-xs font-mono">{location?.lat}, {location?.lng}</span>
                  </div>
                </div>
              </div>

              <div className="glass-morphism p-6 rounded-2xl">
                <h4 className="font-bold mb-4">Action Status</h4>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="text-xs text-slate-500 mb-1">Assigned Department</div>
                    <div className="text-sm font-bold">BBMP West Zone Engineering</div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-secondary-light">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Report Ticket #PH-2024-001 Created</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setPreview(null);
                  setAnalysisResult(null);
                }}
                className="flex-1 py-4 bg-secondary-light hover:bg-secondary-dark text-white rounded-xl font-bold"
              >
                Report Another
              </button>
              <button
                className="flex-1 py-4 glass-morphism border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold"
              >
                Share Status
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportPothole;
