# 🛡️ Namma Suraksha AI

A modern AI-powered civic safety platform for reporting traffic violations, potholes, and emergency SOS alerts.

## 🚀 Features
- **AI Monitor**: Real-time detection of helmets, triple riding, and road hazards.
- **Live Map**: Interactive OpenStreetMap tracking of city-wide incidents.
- **Emergency SOS**: Single-tap alert system with live GPS broadcasting.
- **Admin Dashboard**: Authority-only management portal for incident verification.

## 🛠️ Technology Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Interactions**: Framer Motion + Lucide Icons
- **AI Engine**: Gemini 1.5 Flash (Vision + Chat)
- **Backend/Auth**: Firebase Firestore & Firebase Auth
- **Maps**: MapLibre + OpenStreetMap

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
### 🤖 AI Pothole Detector (Python)
The app now supports custom AI models for potholes and traffic violations!
1. **Setup**:
   ```bash
   cd backend/pothole_ai
   pip install -r requirements.txt
   ```
2. **Models**: Place these files in `backend/pothole_ai/`:
   - `pothole_model.h5` (Road Detection)
   - `helmet.pt` (Helmet Detection)
   - `license_plate.pt` (Plate Detection)
3. **Run**:
   ```bash
   python app.py
   ```
The frontend automatically merges results from your local Python AI and Gemini AI for the most accurate reports.
3. Create a `.env` file in the `frontend` folder and add:
   ```env
   VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```

### Development
```bash
npm run dev
```

### Deployment (Firebase)
```bash
npm run build
npx firebase deploy
```

## 🔐 Test Accounts
See [test_credentials.md](./test_credentials.md) for pre-configured accounts.

---
Built with ❤️ for Civic Safety.
# suraksha-ai
