import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../frontend/.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function testFetch() {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
  });
  
  const data = await response.json();
  console.log("V1 Response Status:", response.status);
  console.log("V1 Data:", JSON.stringify(data, null, 2));

  const urlBeta = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  const responseBeta = await fetch(urlBeta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
  });
  
  const dataBeta = await responseBeta.json();
  console.log("V1Beta Response Status:", responseBeta.status);
  console.log("V1Beta Data:", JSON.stringify(dataBeta, null, 2));
}

testFetch();
