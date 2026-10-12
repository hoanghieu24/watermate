import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

const keyFilePath = path.resolve(process.cwd(), 'data', 'vapid.json');

function getOrGenerateKeys(): VapidKeys {
  // 1. Check environment variables
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }

  // 2. Check saved file in data dir
  if (fs.existsSync(keyFilePath)) {
    try {
      const saved = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));
      if (saved.publicKey && saved.privateKey) {
        return saved;
      }
    } catch {
      // ignore and generate
    }
  }

  // 3. Generate new VAPID keys and persist
  const generated = webpush.generateVAPIDKeys();
  const dir = path.dirname(keyFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(keyFilePath, JSON.stringify(generated, null, 2), 'utf-8');
  console.log('Generated and saved new VAPID keys to data/vapid.json');
  return generated;
}

const keys = getOrGenerateKeys();
export const VAPID_PUBLIC_KEY = keys.publicKey;
export const VAPID_PRIVATE_KEY = keys.privateKey;
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@watermate.local';

// Configure web-push
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

console.log('Web Push VAPID configured successfully. Public Key length:', VAPID_PUBLIC_KEY.length);

