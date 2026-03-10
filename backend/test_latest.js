import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../frontend/.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function testModel(name) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
  });
  
  const data = await response.json();
  console.log(`Model ${name} Status:`, response.status);
  console.log("Data snippet:", JSON.stringify(data).substring(0, 500));
}

async function run() {
  await testModel("gemini-flash-latest");
}

run();
