/**
 * sarvamService.ts
 *
 * Frontend service routing Speech-to-Text and Text-to-Speech requests
 * through the secure BenefitOS backend, keeping all API keys secure.
 */

import { EncodingType, File, Paths } from 'expo-file-system';
import { post } from '@/lib/api/client';

export type SarvamTranscribeResponse = {
  transcript?: string;
  text?: string;
  language_code?: string;
  duration?: number;
};

export type SarvamTextToSpeechResponse = {
  request_id?: string | null;
  audios?: string[];
};

/**
 * Transcribe an audio file URI to text by calling the backend STT relay.
 *
 * @param fileUri Local file URI returned by expo-audio after recording stops
 * @param languageCode BCP-47 code, defaults to 'hi-IN'
 * @returns The transcript string
 */
export async function transcribeAudio(
  fileUri: string,
  languageCode = 'hi-IN'
): Promise<string> {
  const base64 = await new File(fileUri).base64();

  const response = await post<{ transcript: string }>('/api/assistant/transcribe', {
    audio: base64,
    languageCode,
  });

  if (!response.transcript) {
    throw new Error('Backend STT returned an empty transcript.');
  }

  return response.transcript.trim();
}

/**
 * Convert text to speech by calling the backend TTS relay and persist the returned WAV.
 *
 * @param text Text to synthesize
 * @param targetLanguageCode BCP-47 code, defaults to 'hi-IN'
 * @returns Local file URI for playback
 */
export async function synthesizeSpeech(
  text: string,
  targetLanguageCode = 'hi-IN'
): Promise<string> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('Cannot synthesize empty text.');
  }

  const response = await post<{ audio: string }>('/api/assistant/synthesize', {
    text: trimmedText,
    targetLanguageCode,
  });

  const audioBase64 = response.audio;
  if (!audioBase64) {
    throw new Error('Backend TTS returned empty audio data.');
  }

  const audioFile = new File(Paths.cache, `sarvam-reply-${Date.now()}.wav`);
  audioFile.create({ overwrite: true });
  audioFile.write(audioBase64, { encoding: EncodingType.Base64 });

  return audioFile.uri;
}
