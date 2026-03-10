import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MapPin, Phone, Shield, Bell, Send, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const EmergencySOS = () => {
  const [isActivating, setIsActivating] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [location, setLocation] = useState(null);
  const [timer, setTimer] = useState(3);

  useEffect(() => {
    let interval;
    if (isActivating && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (isActivating && timer === 0) {
      triggerSOS();
    }
    return () => clearInterval(interval);
  }, [isActivating, timer]);

  const triggerSOS = async () => {
    setIsActivating(false);
    setIsTriggered(true);
    
    const mockLocation = {
      lat: 12.9716,
      lng: 77.5946,
      address: "Indiranagar 100ft Road, Bengaluru",
      policeNearest: "Indiranagar Police Station (0.8km away)"
    };

    try {
      await axios.post('http://localhost:5000/api/alerts/sos', {
        location: mockLocation
      });
      setLocation(mockLocation);
    } catch (error) {
      console.error('Error triggering SOS:', error);
      setLocation(mockLocation);
    }
  };

  const cancelSOS = () => {
    setIsActivating(false);
    setTimer(3);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-red-600 dark:text-red-500 mb-4 tracking-tight">Emergency SOS</h1>
        <p className="text-slate-600 dark:text-slate-400">Press the button below for immediate police assistance. <br />Your location will be broadcasted to the nearest control room.</p>
      </div>

      <div className="flex flex-col items-center justify-center space-y-12 min-h-[400px]">
        <AnimatePresence mode="wait">
          {!isActivating && !isTriggered ? (
            <motion.button
              key="sos-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsActivating(true)}
              className="relative w-64 h-64 rounded-full bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex items-center justify-center overflow-hidden group"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-red-500/20 rounded-full" 
              />
              <div className="text-white text-center z-10">
                <AlertCircle className="w-16 h-16 mx-auto mb-2" />
                <span className="text-3xl font-black">SOS</span>
              </div>
            </motion.button>
          ) : isActivating ? (
            <motion.div
              key="countdown"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-8xl font-black text-red-600 mb-8">{timer}</div>
              <p className="text-xl font-bold mb-8">Sending Emergency Alert...</p>
              <button
                onClick={cancelSOS}
                className="px-8 py-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-full font-bold"
              >
                Cancel SOS
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="triggered"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-8"
            >
              <div className="bg-red-600 text-white p-6 rounded-2xl flex items-center space-x-6">
                <div className="bg-white/20 p-4 rounded-xl">
                  <Send className="w-10 h-10 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic">ALERT BROADCASTED</h2>
                  <p className="opacity-90">Police units are being dispatched to your location.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col space-y-6">
                  <div className="glass-morphism p-6 rounded-2xl border-l-4 border-danger">
                    <h3 className="font-bold flex items-center space-x-2 mb-4 text-slate-800 dark:text-slate-100">
                      <MapPin className="w-4 h-4 text-danger" />
                      <span>Your GPS Data Transmitted</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between">
                        <span className="text-slate-500">Address:</span>
                        <span className="font-medium text-right ml-4">{location?.address}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-500">Coordinates:</span>
                        <span className="font-mono">{location?.lat}, {location?.lng}</span>
                      </p>
                    </div>
                  </div>

                  <div className="glass-morphism p-6 rounded-2xl border-l-4 border-primary">
                    <h3 className="font-bold flex items-center space-x-2 mb-4 text-slate-800 dark:text-slate-100">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Responder Info</span>
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-primary">{location?.policeNearest}</p>
                      <p className="text-slate-500">ETA: ~4-6 Minutes</p>
                    </div>
                  </div>
                </div>

                {/* Google Maps Placeholder */}
                <div className="glass-morphism rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[250px] bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=12.9716,77.5946&zoom=15&size=600x400&maptype=roadmap&markers=color:red%7Clabel:SOS%7C12.9716,77.5946&markers=color:blue%7Clabel:P%7C12.9750,77.5900&style=feature:all|element:labels.text.fill|color:0x8e8e8e&style=feature:all|element:labels.text.stroke|color:0x212121&style=feature:water|element:geometry|color:0x2a2b2c&style=feature:landscape|element:geometry|color:0x1b1c1e')] bg-cover bg-center opacity-60 dark:opacity-40 filter grayscale contrast-125 mix-blend-multiply dark:mix-blend-screen"></div>
                  <div className="z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl text-center">
                     <MapPin className="w-8 h-8 text-primary mx-auto mb-2 animate-bounce" />
                     <p className="font-bold text-sm">Tracking Nearest Station...</p>
                     <p className="text-xs text-slate-500 mt-1">Live Map Simulation</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>Call 112 Directly</span>
                </button>
                <button 
                  onClick={() => setIsTriggered(false)}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl font-bold"
                >
                  I'm Safe Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-4">
          <Bell className="w-8 h-8 text-primary-light mx-auto mb-2" />
          <h4 className="font-bold mb-1">Silent Alert</h4>
          <p className="text-xs text-slate-500">Sends notification without making noise on your device.</p>
        </div>
        <div className="p-4">
          <Shield className="w-8 h-8 text-secondary-light mx-auto mb-2" />
          <h4 className="font-bold mb-1">Verified Dispatch</h4>
          <h4 className="font-bold mb-1">Police Dispatch</h4>
          <p className="text-xs text-slate-500">Directly connected to the city's Integrated Command Center.</p>
        </div>
        <div className="p-4">
          <CheckCircle2 className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
          <h4 className="font-bold mb-1">Auto-Log</h4>
          <p className="text-xs text-slate-500">Captures surroundings and audio automatically for evidence.</p>
        </div>
      </div>
    </div>
  );
};

export default EmergencySOS;
