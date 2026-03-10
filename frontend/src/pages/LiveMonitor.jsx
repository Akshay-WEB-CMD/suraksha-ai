import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, AlertTriangle, CheckCircle, Loader2,
  Play, Square, RotateCcw, Video, Image as ImageIcon,
  MonitorPlay, ShieldAlert, ZoomIn, X, Zap, Eye,
  CloudRain, Car, Bike, TriangleAlert
} from 'lucide-react';

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/* ─────────────── AI Analysis Helper (Real Vision) ─────────────── */
async function analyzeImageWithAI(base64Image, mode, coords = null) {
  if (!GEMINI_API_KEY) {
    return "⚠️ **Gemini API Key missing.** Please add `VITE_GEMINI_API_KEY` to your `.env` file to enable real vision analysis.";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const locationContext = coords 
    ? `\n\nIMPORTANT: Real-world Location Context provided:
Lat: ${coords.lat}, Lng: ${coords.lng}
Please include this exact location in the "Location" or "Header" section of your report so it can be mapped.`
    : '\n\nNote: Exact geographic location data was not available for this image.';

  const prompts = {
    road: `You are a road condition AI inspector. Analyze this road image carefully.
Identify and report:
1. Overall road condition (Good/Fair/Poor/Critical)
2. Potholes: Detect every visible pothole. Estimate size (small/medium/large) and its relative location in the frame.
3. Road damage: cracks, erosion, faded lane markings.
4. Safety hazards for drivers and pedestrians.
5. Urgency level (1-10) and recommended action.
6. Geographic Location: State the coordinates if provided in context.${locationContext}

Format as a professional tech report. Use bold headings.`,

    traffic: `You are an AI traffic law enforcement system for India. Analyze this traffic scene.
Identify and report ALL violations visible:
1. People NOT wearing helmets (on motorcycles/scooters).
2. Triple riding (more than 2 people on a 2-wheeler).
3. Signal/traffic lights violations.
4. Wrong-side driving or improper lane use.
5. Mobile phone use while driving.
6. Geographic Location: Include coordinates if provided below.${locationContext}

If you see a violation, describe the vehicle, the specific person (rider/pillion), and the exact nature of the offense.
If everything is safe, state "No traffic violations detected."
Be very precise. This is for law enforcement evidence.`
  };

  try {
    // ─── Pothole Detection (Mode: Road) ───
    let potholeResult = null;
    if (mode === 'road') {
      try {
        const formData = new FormData();
        const base64Data = base64Image.split(',')[1];
        const mimeType = base64Image.split(';')[0].split(':')[1];
        const blob = await (await fetch(base64Image)).blob();
        formData.append('image', blob, `capture.${mimeType.split('/')[1]}`);
        formData.append('lat', coords?.lat || 0);
        formData.append('lon', coords?.lng || 0);

        const AI_BASE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:5001';
        const pyResp = await fetch(`${AI_BASE_URL}/detect`, { method: 'POST', body: formData });
        const pyData = await pyResp.json();
        potholeResult = pyData.result;
      } catch (e) {
        console.warn('Pothole AI service unreachable:', e);
      }
    }

    // ─── Traffic Detection (Mode: Traffic) ───
    let trafficAI = null;
    if (mode === 'traffic') {
      try {
        const formData = new FormData();
        const blob = await (await fetch(base64Image)).blob();
        formData.append('image', blob, 'traffic.jpg');

        const AI_BASE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:5001';
        const pyResp = await fetch(`${AI_BASE_URL}/traffic`, { method: 'POST', body: formData });
        trafficAI = await pyResp.json();
      } catch (e) {
        console.warn('Traffic AI service unreachable:', e);
      }
    }

    const customContext = potholeResult === 'pothole' 
      ? `\n[IMPORTANT: Custom AI detected: POTHOLE]` 
      : (trafficAI ? `\n[ACTION: Custom Traffic AI detected: ${trafficAI.violations.join(', ') || 'No Violations'}. Vehicle Plate: ${trafficAI.plate}]` : '');

    const result = await model.generateContent([
      customContext + ' ' + prompts[mode],
      {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: base64Image.split(';')[0].split(':')[1]
        }
      }
    ]);

    const response = await result.response;
    let finalReport = response.text();
    
    // Inject custom AI badges
    if (potholeResult === 'pothole') {
      finalReport = `🚨 **URGENT: CUSTOM AI VERIFIED POTHOLE DETECTED** 🚨\n\n` + finalReport;
    }
    if (trafficAI && trafficAI.violations.length > 0) {
      finalReport = `📸 **TRAFFIC VIOLATION LOGGED: ${trafficAI.violations.join(' & ').toUpperCase()}**\n🚗 **VEHICLE PLATE:** ${trafficAI.plate}\n\n` + finalReport;
    }

    return finalReport;
  } catch (err) {
    console.error('Gemini error:', err);
    let errorMessage = err.message;
    
    // Friendly error decoding
    if (errorMessage.includes('API_KEY_INVALID')) {
      errorMessage = "Invalid Gemini API Key. Please check your .env file.";
    } else if (errorMessage.includes('PERMISSION_DENIED')) {
      errorMessage = "API Key does not have permission for Generative AI. Enable it in Google AI Studio.";
    } else if (errorMessage.includes('quota')) {
      errorMessage = "AI Quota exceeded. Please wait a moment or check your billing.";
    }

    return `❌ **AI Analysis Failed**\n\n${errorMessage}\n\n*Technical Details:* ${err.message}`;
  }
}

/* ─────────────── Detection Badge ─────────────── */
const DetectionBadge = ({ icon: Icon, label, color }) => (
  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${color}`}>
    <Icon className="w-3.5 h-3.5" />
    {label}
  </div>
);

/* ─────────────── Monitor Panel ─────────────── */
const MonitorPanel = ({ mode }) => {
  const [stream, setStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeInput, setActiveInput] = useState('camera'); // 'camera' | 'upload'
  const [coords, setCoords] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const isRoad = mode === 'road';

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setIsStreaming(true);
      setCapturedImage(null);
      setAnalysis(null);
    } catch (err) {
      alert('Camera access denied or unavailable. Please use the Upload option.');
    }
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsStreaming(false);
  }, [stream]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    setAnalysis(null);
  }, [stopCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setAnalysis(null);
    const reader = new FileReader();
    reader.onload = ev => setUploadedPreview(ev.target.result);
    reader.readAsDataURL(file);
    stopCamera();
  };

  const currentImage = activeInput === 'upload' ? uploadedPreview : capturedImage;

  const runAnalysis = async () => {
    if (!currentImage) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    let currentCoords = null;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      currentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(currentCoords);
    } catch (err) {
      console.warn('Geolocation failed for analysis:', err);
    }

    const result = await analyzeImageWithAI(currentImage, mode, currentCoords);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const reset = () => {
    stopCamera();
    setCapturedImage(null);
    setUploadedPreview(null);
    setUploadedFile(null);
    setAnalysis(null);
  };

  // Format analysis lines
  const analysisLines = analysis ? analysis.split('\n').filter(Boolean) : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left: Camera / Upload Panel */}
      <div className="space-y-5">
        {/* Input toggle */}
        <div className="flex gap-3">
          {['camera', 'upload'].map(t => (
            <button
              key={t}
              onClick={() => { setActiveInput(t); reset(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                activeInput === t
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/50'
              }`}
            >
              {t === 'camera' ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {t === 'camera' ? 'Live Camera' : 'Upload File'}
            </button>
          ))}
        </div>

        {/* Viewport */}
        <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          {/* Live stream */}
          {activeInput === 'camera' && !capturedImage && (
            <>
              {isStreaming ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* HUD overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 bg-red-600/80 text-white text-[10px] font-black rounded-md uppercase animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />LIVE
                      </span>
                      {isRoad
                        ? <span className="px-2 py-1 bg-primary/80 text-white text-[10px] font-bold rounded-md">Road Scan</span>
                        : <span className="px-2 py-1 bg-orange/80 text-white text-[10px] font-bold rounded-md">Violation Scan</span>
                      }
                    </div>
                    {/* Scanning grid */}
                    <div className="absolute inset-4 border border-primary/30 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-primary absolute top-0 left-0" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-primary absolute top-0 right-0" />
                      <div className="w-4 h-4 border-b-2 border-l-2 border-primary absolute bottom-0 left-0" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-primary absolute bottom-0 right-0" />
                      <motion.div
                        animate={{ y: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500">
                  <Camera className="w-16 h-16 opacity-20" />
                  <p className="text-sm font-medium">Camera feed will appear here</p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg hover:bg-primary-dark active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start Camera
                  </button>
                </div>
              )}
            </>
          )}

          {/* Captured from camera */}
          {activeInput === 'camera' && capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          )}

          {/* Uploaded file preview */}
          {activeInput === 'upload' && (
            <>
              {uploadedPreview ? (
                uploadedFile?.type.startsWith('video/') ? (
                  <video src={uploadedPreview} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={uploadedPreview} alt="Uploaded" className="w-full h-full object-cover" />
                )
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer group hover:bg-slate-800/50 transition-colors"
                >
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-300">Click to upload</p>
                    <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, MP4, MOV</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Analyzing overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-primary rounded-full animate-spin border-t-transparent" />
                <Zap className="w-7 h-7 text-primary absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-sm">AI Analyzing...</p>
                <p className="text-slate-400 text-xs mt-1">{isRoad ? 'Scanning road surface' : 'Detecting violations'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Controls */}
        <div className="flex gap-3">
          {activeInput === 'camera' && isStreaming && !capturedImage && (
            <button
              onClick={captureFrame}
              className="flex-1 py-3 bg-orange text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-dark transition-all active:scale-95 shadow-lg"
            >
              <Camera className="w-4 h-4" /> Capture Frame
            </button>
          )}
          {activeInput === 'upload' && !uploadedPreview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-all active:scale-95 shadow-lg"
            >
              <Upload className="w-4 h-4" /> Choose File
            </button>
          )}
          {currentImage && !isAnalyzing && (
            <button
              onClick={runAnalysis}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4" /> Run AI Analysis
            </button>
          )}
          {(capturedImage || uploadedPreview || isStreaming) && (
            <button
              onClick={reset}
              className="py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Detection tags */}
        <div className="flex flex-wrap gap-2">
          {isRoad ? (
            <>
              <DetectionBadge icon={CloudRain} label="Pothole Detection" color="text-warning border-warning/30 bg-warning/10" />
              <DetectionBadge icon={TriangleAlert} label="Road Damage" color="text-orange border-orange/30 bg-orange/10" />
              <DetectionBadge icon={Eye} label="Surface Analysis" color="text-primary border-primary/30 bg-primary/10" />
            </>
          ) : (
            <>
              <DetectionBadge icon={Bike} label="Triple Riding" color="text-danger border-danger/30 bg-danger/10" />
              <DetectionBadge icon={ShieldAlert} label="No Helmet" color="text-orange border-orange/30 bg-orange/10" />
              <DetectionBadge icon={Car} label="Signal Jump" color="text-warning border-warning/30 bg-warning/10" />
            </>
          )}
        </div>
      </div>

      {/* Right: Analysis Results */}
      <div className="space-y-5">
        <div className="glass-morphism rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg h-full flex flex-col min-h-[400px]">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">AI Report</h3>
            </div>
            {analysis && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full">
                Analysis Complete
              </span>
            )}
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!analysis && !isAnalyzing && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center gap-4 py-12"
                >
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                    {isRoad
                      ? <CloudRain className="w-10 h-10 text-slate-300" />
                      : <ShieldAlert className="w-10 h-10 text-slate-300" />
                    }
                  </div>
                  <div>
                    <p className="font-bold text-slate-500 text-sm">No analysis yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                      {isRoad
                        ? 'Capture or upload a road image/video, then click "Run AI Analysis"'
                        : 'Capture or upload traffic footage, then click "Run AI Analysis"'
                      }
                    </p>
                  </div>
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {[0.1, 0.2, 0.35, 0.15, 0.25].map((w, i) => (
                    <div key={i} className={`h-4 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse`} style={{ width: `${w * 100 + 30}%` }} />
                  ))}
                </motion.div>
              )}

              {analysis && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {analysisLines.map((line, i) => {
                    const isHeader = line.startsWith('**') && line.endsWith('**');
                    const isViolation = line.includes('⚠️') || line.toLowerCase().includes('violation') || line.toLowerCase().includes('detected');
                    const isOk = line.toLowerCase().includes('no violation') || line.toLowerCase().includes('good');

                    return (
                      <div
                        key={i}
                        className={`text-sm leading-relaxed p-2 rounded-lg ${
                          isHeader
                            ? 'font-bold text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-800/50'
                            : isViolation
                              ? 'text-orange-700 dark:text-orange-300 bg-orange/5 border-l-2 border-orange pl-3'
                              : isOk
                                ? 'text-green-700 dark:text-green-300 bg-green-500/5 border-l-2 border-green-500 pl-3'
                                : 'text-slate-700 dark:text-slate-300'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: line
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/^#+\s/, '')
                        }}
                      />
                    );
                  })}

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                    <button
                      onClick={() => {
                        const blob = new Blob([analysis], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `suraksha-ai-report-${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Download Report
                    </button>
                    <button
                      onClick={() => setAnalysis(null)}
                      className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Main LiveMonitor Page ─────────────── */
const LiveMonitor = () => {
  const [activeTab, setActiveTab] = useState('traffic');

  const tabs = [
    {
      id: 'traffic',
      label: 'Violations Monitor',
      icon: ShieldAlert,
      desc: 'Detect helmet violations, triple riding, signal jumping & more using AI',
      color: 'text-orange',
      badge: 'AI Powered',
    },
    {
      id: 'road',
      label: 'Road Condition Monitor',
      icon: CloudRain,
      desc: 'Scan roads for potholes, cracks, surface damage and safety hazards',
      color: 'text-primary',
      badge: 'Live Scan',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 px-4 py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
              <MonitorPlay className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Live Monitor</h1>
            <span className="px-2.5 py-0.5 bg-primary/20 border border-primary/30 text-primary text-[10px] font-black rounded-full uppercase tracking-wider">AI Enabled</span>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            Real-time AI-powered road safety monitoring. Use your camera or upload footage to instantly detect traffic violations and road hazards.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group p-5 rounded-2xl border text-left transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20'
                  : 'bg-white/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  activeTab === tab.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                  <tab.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{tab.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      activeTab === tab.id ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>{tab.badge}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tab.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Monitor Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-1 h-6 rounded-full ${activeTab === 'traffic' ? 'bg-orange' : 'bg-primary'}`} />
              <h2 className="font-black text-slate-900 dark:text-white text-lg">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-500 font-medium">Active</span>
            </div>

            <MonitorPanel mode={activeTab} />
          </motion.div>
        </AnimatePresence>

        {/* Info section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Camera Access', desc: 'Click "Start Camera" to use your device camera for real-time detection', icon: Camera },
            { title: 'Upload Evidence', desc: 'Upload images or videos (JPG, PNG, MP4, MOV) for AI analysis', icon: Upload },
            { title: 'AI Analysis', desc: 'Powered by DeepSeek AI — instant detection reports ready for action', icon: Zap },
          ].map((item, i) => (
            <div key={i} className="glass-morphism p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;
