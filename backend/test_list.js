import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../frontend/.env') });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

async function list() {
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Not needed for list but SDK works this way? No.
    // Use the low level fetch or just use a dummy model to get to the client?
    // Actually the SDK has a listModels method on the client? No, it's on the main object in new versions.
    // Wait, let's check the SDK docs for listModels.
    // In @google/generative-ai, there isn't a simple listModels on the main object usually.
    // Actually, maybe I can just try 'gemini-1.5-flash-latest'.
    
    console.log("Listing models...");
    // Let's try more variations
    const names = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.0-pro", "gemini-pro"];
    for (const name of names) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const result = await model.generateContent("test");
        console.log(`Model ${name} works!`);
        break;
      } catch (e) {
        console.log(`Model ${name} failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error("List Error:", err);
  }
}

list();
