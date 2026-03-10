import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../frontend/.env') });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function test() {
  console.log("Testing with API Key:", process.env.VITE_GEMINI_API_KEY ? "FOUND" : "MISSING");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hi");
    console.log("Response:", result.response.text());
  } catch (err) {
    console.error("Error with gemini-1.5-flash:", err.message);
    
    try {
      console.log("Trying gemini-pro...");
      const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
      const resultPro = await modelPro.generateContent("Say hi");
      console.log("gemini-pro Response:", resultPro.response.text());
    } catch (err2) {
      console.error("Error with gemini-pro:", err2.message);
    }
  }
}

test();
