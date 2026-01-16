import { config } from '../config';
import { readTextFile, saveBinaryFile } from './storage';

export interface TTSOptions {
  voiceId?: string;
  twoVoice?: boolean;
}

/**
 * Generate TTS audio from script using ElevenLabs
 */
export async function generateTTSAudio(
  courseCode: string,
  lectureId: number,
  scriptPath: string,
  options: TTSOptions = {}
): Promise<string | null> {
  if (!config.elevenLabs.apiKey) {
    console.warn('ElevenLabs API key not configured. Skipping TTS generation.');
    return null;
  }

  try {
    const script = await readTextFile(scriptPath);
    const voiceId = options.voiceId || config.elevenLabs.voiceId;
    
    if (!voiceId) {
      throw new Error('ElevenLabs voice ID is required. Set ELEVENLABS_VOICE_ID in environment variables.');
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.elevenLabs.apiKey,
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Save MP3 file
    const mp3Path = await saveBinaryFile(
      courseCode,
      lectureId,
      'podcast_audio.mp3',
      audioBuffer
    );

    return mp3Path;
  } catch (error) {
    console.error('TTS generation failed:', error);
    // Don't throw - TTS is optional
    return null;
  }
}

