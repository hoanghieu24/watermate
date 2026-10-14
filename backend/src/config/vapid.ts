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

// Stable default VAPID key pair to ensure subscriptions remain valid across ephemeral container restarts (Render)
const DEFAULT_VAPID_KEYS: VapidKeys = {
  publicKey: 'BPmSJ7vaW6tPLhIJlC6ntO5z3HnzFEozxR2zLuYfOF15P8YdGqsOLQt2hVl0y1eIz5PtuooP1EloTnkJO4lnP2g',
  privateKey: 'o2BesBoUNjKr559NindXjTTNP-zs3Ld6CARpZQP1KzE',
};

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
      // ignore
    }
  }

  // 3. Persist stable default keys so subscriptions don't get invalidated on container redeploy
  try {
    const dir = path.dirname(keyFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(keyFilePath, JSON.stringify(DEFAULT_VAPID_KEYS, null, 2), 'utf-8');
  } catch {
    // ignore
  }

  return DEFAULT_VAPID_KEYS;
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

