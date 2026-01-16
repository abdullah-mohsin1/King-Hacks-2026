import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./data/app.db',
  storageRoot: process.env.STORAGE_ROOT || './storage',
  
  // ElevenLabs TTS
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || '',
  },
  
  // LLM Providers
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  
  // File upload limits
  maxFileSize: 200 * 1024 * 1024, // 200MB
  allowedMimeTypes: [
    'audio/mpeg',
    'audio/mp3',
    'audio/m4a',
    'audio/wav',
    'audio/x-wav',
    'video/mp4',
    'video/x-m4v',
  ],
};

// Storage paths
export const storagePaths = {
  audio: path.join(config.storageRoot, 'audio'),
  outputs: path.join(config.storageRoot, 'outputs'),
};

