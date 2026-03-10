import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Firebase Initialization
const firebaseConfig = {
  apiKey: "AIzaSyCkQMgCR08r4tXBl8f-YDt5woZF_y41O1Q",
  authDomain: "suraksha-d223c.firebaseapp.com",
  projectId: "suraksha-d223c",
  storageBucket: "suraksha-d223c.firebasestorage.app",
  messagingSenderId: "454144920991",
  appId: "1:454144920991:web:2421624b4bf63c2d2001aa",
  measurementId: "G-ZBB4BC7F12"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const incidentsCol = collection(db, 'incidents');

console.log("Connected to Firebase Firestore");

// AI Initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_PLACEHOLDER');
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "You are Namma Suraksha AI, a specialized road safety and traffic assistant for Bangalore. You MUST ONLY answer queries related to traffic rules, road safety, pothole reporting, traffic violations, and general civic safety in Bangalore. If a user asks anything else (like jokes, general knowledge, coding, or unrelated topics), politely decline and state that you are only programmed for road safety queries."
});

// API Routes
app.post('/api/reports/violation', async (req, res) => {
  try {
    const { title, details, vehicleNumber, location, evidence } = req.body;
    const report = {
      type: 'violation',
      title,
      description: details,
      vehicleDetails: { plateNumber: vehicleNumber },
      location,
      evidence: { url: evidence, mediaType: 'image' },
      severity: 'Medium',
      status: 'Pending',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(incidentsCol, report);
    res.status(201).json({ success: true, report: { id: docRef.id, ...report } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reports/pothole', async (req, res) => {
  try {
    const { potholesCount, severity, location, evidence } = req.body;
    const report = {
      type: 'pothole',
      title: `Pothole Report (${potholesCount})`,
      severity,
      location,
      evidence: { url: evidence, mediaType: 'image' },
      status: 'Pending',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(incidentsCol, report);
    res.status(201).json({ success: true, report: { id: docRef.id, ...report } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/alerts/sos', async (req, res) => {
  try {
    const { location } = req.body;
    const alert = {
      type: 'sos',
      title: 'Emergency SOS Alert',
      location,
      severity: 'Critical',
      status: 'Pending',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(incidentsCol, alert);
    res.status(201).json({ success: true, alert: { id: docRef.id, ...alert } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ reply: "Gemini API key is missing." });
    }
    
    const result = await model.generateContent(message);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: "Thinking error. Please try again later." });
  }
});

// AI Analysis Endpoint (Helmet/Pothole)
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { image, type } = req.body; // image is base64
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: "Gemini API key is missing." });
    }

    const prompt = type === 'violation' 
      ? "Look at this traffic violation image. Detect if the rider is wearing a helmet. If not, state 'Violation Detected: No Helmet'. Also try to extract the vehicle number plate if visible. Return JSON format: { \"detected\": boolean, \"details\": string, \"vehicleNumber\": string, \"confidence\": number }"
      : "Look at this road image. Detect potholes. Return JSON format: { \"detected\": boolean, \"potholesCount\": number, \"severity\": \"Low\"|\"Medium\"|\"High\", \"details\": string }";

    // Convert base64 to parts
    const imagePart = {
      inlineData: {
        data: image.split(',')[1],
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON from text (Gemini sometimes adds markdown blocks)
    let jsonStr = text;
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
       jsonStr = text.substring(startIdx, endIdx + 1);
    }
    res.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: "AI analysis failed." });
  }
});

app.get('/api/incidents', async (req, res) => {
  try {
    const q = query(incidentsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const incidents = snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        _id: docSnapshot.id,
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
      };
    });
    res.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    // If the index is not built for orderBy, just fetch all
    const snapshot = await getDocs(incidentsCol);
    const incidents = snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        _id: docSnapshot.id,
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
      };
    }).sort((a,b) => b.createdAt - a.createdAt);
    res.json(incidents);
  }
});

app.patch('/api/incidents/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const incidentRef = doc(db, 'incidents', req.params.id);
    await updateDoc(incidentRef, { status });
    res.json({ id: req.params.id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
