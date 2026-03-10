import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are "Suraksha AI", a specialized traffic law and road safety assistant for India/Karnataka. 
You ONLY answer questions strictly related to:
- Indian traffic rules and regulations (Motor Vehicles Act, CMVR)
- Road safety laws, fines, and penalties
- Helmet, seatbelt, signal, lane, speed limit rules
- Traffic violations like triple riding, drunk driving, mobile phone use
- Driving licence rules, vehicle documents
- Pothole reporting, road infrastructure safety

If a question is NOT related to traffic, driving, road safety, or vehicle laws, respond ONLY with:
"I can only help with traffic rules and road safety topics. Please ask me about traffic laws, fines, or road safety in India."

Keep answers concise, factual, and relevant to Indian/Karnataka traffic laws. Be friendly and helpful.`;

const QUICK_PROMPTS = [
  'What is the fine for no helmet?',
  'Triple riding penalty?',
  'Signal jumping fine 2024?',
  'Drunk driving punishment?',
];

const TrafficChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🚦 Namaskara! I\'m **Suraksha AI** — your traffic law expert.\n\nI can help you with:\n• Traffic fines & penalties\n• Helmet, signal & lane rules\n• Driving licence requirements\n• Road safety laws\n\nWhat would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      if (!GEMINI_API_KEY) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ **Gemini API Key missing.** Give me the key in `.env` or just paste it here (I will detect it).',
          isError: true
        }]);
        setIsLoading(false);
        return;
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        systemInstruction: SYSTEM_PROMPT,
      });

      const chat = model.startChat({
        history: messages
          .filter(m => !m.isError)
          .slice(1) // Skip the initial assistant greeting to ensure history starts with 'user'
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
          })),
      });

      const result = await chat.sendMessage(text || input);
      const response = await result.response;
      const reply = response.text();

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error("Gemini API Error, falling back to test data:", err);

      const lowercaseInput = (text || input).toLowerCase();
      let fallbackReply = "Traffic penalties depend on the specific violation. Always ensure you carry valid documents, wear safety gear, and follow signals.";

      if (lowercaseInput.includes('helmet')) {
        fallbackReply = "**Helmet Violation Fine (Section 129 MV Act):**\nRiding without a helmet in Karnataka attracts a fine of **₹500** and a 3-month suspension of your driving licence.";
      } else if (lowercaseInput.includes('triple')) {
        fallbackReply = "**Triple Riding Fine (Section 128 MV Act):**\nRiding with more than two people on a two-wheeler attracts a fine of **₹1,000**.";
      } else if (lowercaseInput.includes('signal') || lowercaseInput.includes('jump')) {
        fallbackReply = "**Signal Jumping Fine:**\nJumping a red light is considered dangerous driving and attracts a fine of **₹500** (First Offence) or **₹1,500** (Repeat Offence).";
      } else if (lowercaseInput.includes('drink') || lowercaseInput.includes('drunk')) {
        fallbackReply = "**Drunk Driving Penalty (Section 185 MV Act):**\nDriving under the influence of alcohol attracts a fine up to **₹10,000** and/or 6 months imprisonment for the first offence.";
      } else if (lowercaseInput.includes('license') || lowercaseInput.includes('licence')) {
        fallbackReply = "**Driving Without Licence:**\nDriving without a valid driving licence attracts a massive penalty of **₹5,000**.";
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `*( AI Mode)*\n\n${fallbackReply}`,
        isError: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mb-4 w-[340px] md:w-[400px] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden"
            style={{ height: '520px', background: 'var(--chatbot-bg, white)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">Suraksha AI</p>
                  <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">Traffic Law Expert</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : msg.isError
                        ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-tl-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'
                      }`}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  className="text-[10px] font-semibold whitespace-nowrap px-2.5 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-all border border-primary/20 shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about traffic rules..."
                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setIsOpen(prev => !prev)}
        className="relative bg-primary text-white p-4 rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="w-6 h-6" /></motion.span>
            : <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageSquare className="w-6 h-6" /></motion.span>
          }
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>
    </div>
  );
};

export default TrafficChatbot;
