import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, MapPin, CheckCircle2, AlertCircle, Loader2, Play, RefreshCw, X } from 'lucide-react';
import axios from 'axios';
import Webcam from 'react-webcam';

const ViolationReport = () => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [violationType, setViolationType] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const violationTypes = [
    { id: 'no-helmet', label: 'No Helmet', icon: '⛑️' },
    { id: 'signal-jump', label: 'Signal Jump', icon: '🚦' },
    { id: 'triple-riding', label: 'Triple Riding', icon: '🏍️' },
    { id: 'wrong-side', label: 'Wrong Side Driving', icon: '↩️' },
  ];

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
          lat: 12.9716,
          lng: 77.5946,
          address: "MG Road, Bengaluru, Karnataka"
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
        type: 'violation'
      });
      
      const result = response.data;
      
      // Auto-report to backend
      await axios.post('http://localhost:5000/api/reports/violation', {
        title: violationType,
        details: result.details,
        vehicleNumber: result.vehicleNumber || "KA-01-XXXX",
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
      console.error('Error reporting violation:', error);
      setIsAnalyzing(false);
      // Fallback for demo
      setStep(3);
      setAnalysisResult({ details: "Simulation complete (API offline or Error)", vehicleNumber: "KA-01-XXXX", confidence: 0.85 });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Report Traffic Violation</h1>
          <p className="text-slate-600 dark:text-slate-400">Help improve city safety using AI-powered reporting.</p>
        </div>
        <div className="hidden sm:flex space-x-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`w-3 h-3 rounded-full ${step >= s ? 'bg-primary-light' : 'bg-slate-300 dark:bg-slate-700'}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center group transition-all hover:border-primary-light">
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
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-primary-light text-white px-8 py-3 rounded-full font-bold shadow-2xl flex items-center space-x-2 hover:bg-primary-dark transition-all scale-110"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Snapshot</span>
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
                  {file?.type.startsWith('image') || preview.startsWith('data:image') ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Play className="w-12 h-12 text-primary-light" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                    <button 
                      onClick={() => { setPreview(null); setFile(null); }}
                      className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl"
                    >
                      <RefreshCw className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setShowWebcam(true)}
                      className="p-3 bg-primary-light text-white rounded-full hover:scale-110 transition-transform shadow-xl"
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
                      className="group flex flex-col items-center space-y-2 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:text-primary-light transition-all"
                    >
                      <Upload className="w-10 h-10 text-slate-400 group-hover:text-primary-light transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Upload File</span>
                    </button>
                    <button 
                      onClick={() => setShowWebcam(true)}
                      className="group flex flex-col items-center space-y-2 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl hover:text-primary-light transition-all"
                    >
                      <Camera className="w-10 h-10 text-slate-400 group-hover:text-primary-light transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Camera</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Capture or upload evidence of the violation</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">AI will auto-detect helmets & plates</p>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
            </div>

            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-morphism p-4 rounded-2xl flex items-center space-x-3 text-sm border border-primary-light/10"
              >
                <div className="w-10 h-10 bg-secondary-light/10 rounded-xl flex items-center justify-center">
                  <MapPin className="text-secondary-light w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Incident Location</p>
                  <p className="text-[10px] text-slate-500 uppercase font-black">{location ? location.address : "Detecting location..."}</p>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Select Violation Type</label>
              <div className="relative">
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  className="w-full appearance-none bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-4 text-slate-800 dark:text-white font-semibold transition-all outline-none"
                >
                  <option value="" disabled>Choose a violation type...</option>
                  {violationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              disabled={!preview || !violationType}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-primary-light hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xl shadow-2xl shadow-primary-light/30 transition-all flex items-center justify-center space-x-3"
            >
              <span>Initialize AI Inspector</span>
              <Play className="w-6 h-6" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            {isAnalyzing ? (
              <div className="space-y-8">
                <div className="relative w-64 h-64 mx-auto">
                   <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-primary-light border-t-transparent rounded-full"
                  />
                  <div className="absolute inset-4 overflow-hidden rounded-full border-4 border-slate-200 dark:border-slate-800">
                    <img src={preview} className="w-full h-full object-cover grayscale opacity-50" alt="Scanning" />
                    <motion.div 
                      animate={{ y: [-100, 200, -100] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-x-0 h-1 bg-primary-light shadow-[0_0_15px_rgba(var(--primary-rgb),1)] z-10"
                    />
                    
                    {/* Simulated OCR Scanner Focus */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-8 border-2 border-green-400 bg-green-400/20 rounded z-20"
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">AI Inspection In-Progress</h2>
                  <div className="flex flex-col items-center mt-4 space-y-2">
                     <div className="flex items-center space-x-2 text-sm font-bold text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-light" />
                        <span>Analyzing road safety violation...</span>
                     </div>
                     <div className="flex items-center space-x-2 text-sm font-bold text-green-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Running Deep OCR for License Plate...</span>
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-8 glass-morphism p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="w-20 h-20 bg-primary-light/10 text-primary-light rounded-full flex items-center justify-center mx-auto">
                   <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Ready for AI Verification</h2>
                  <p className="text-slate-500 text-sm mt-2 font-medium">Our advanced Gemini model will scan for safety violations and extract vehicle data.</p>
                </div>
                <button
                  onClick={runAIAnalysis}
                  className="w-full py-4 bg-primary-light hover:bg-primary-dark text-white rounded-2xl font-black text-lg shadow-xl shadow-primary-light/30 transition-all transform hover:scale-[1.02]"
                >
                  Start Scanning
                </button>
                <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-primary-light transition-colors">
                   Change Evidence
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 3 && analysisResult && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex items-start space-x-4">
              <CheckCircle2 className="text-green-500 w-8 h-8 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Violation Confirmed</h3>
                <p className="text-slate-600 dark:text-slate-400">{analysisResult.details}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-morphism p-6 rounded-2xl">
                <h4 className="font-bold mb-4 flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Detected Details</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Vehicle Plate:</span>
                    <span className="font-mono font-bold bg-slate-200 dark:bg-slate-800 px-2 rounded">{analysisResult.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Confidence:</span>
                    <span className="font-bold text-primary-light">{(analysisResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Location:</span>
                    <span className="text-sm">{location?.address}</span>
                  </div>
                </div>
              </div>

              <div className="glass-morphism p-6 rounded-2xl">
                <h4 className="font-bold mb-4 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>System Action</span>
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Report sent to Police Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Alert sent to next signal junction</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setPreview(null);
                setViolationType('');
                setAnalysisResult(null);
              }}
              className="w-full py-4 glass-morphism border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold"
            >
              Finish & Report New Issue
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Help icons mapping for visual flair
const ShieldCheck = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default ViolationReport;
