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
  if (response.status !== 200) console.log(JSON.stringify(data, null, 2));
  return response.status === 200;
}

async function run() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-2.0-flash");
  await testModel("gemini-flash-latest");
}

run();
