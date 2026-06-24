/**
 * sarvamService.ts
 *
 * Thin wrapper around the Sarvam AI Speech-to-Text REST endpoint.
 * Docs: https://docs.sarvam.ai/api-reference-docs/speech-to-text/transcribe
 *
 * POST https://api.sarvam.ai/speech-to-text
 * Headers : api-subscription-key: <key>
 * Body    : multipart/form-data
 *   file           — audio file (wav / mp4 / m4a)
 *   model          — "saaras:v3"
 *   language_code  — BCP-47 language tag
 *   mode           — "transcribe"
 */

import { EncodingType, File, Paths } from 'expo-file-system';

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';
const SARVAM_KEY = process.env.EXPO_PUBLIC_SARVAM_KEY ?? '';

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

function getAudioFileMeta(fileUri: string) {
  const uriExtension = fileUri.split('?')[0]?.split('.').pop()?.toLowerCase();

  return {
    uriExtension: uriExtension ?? 'm4a',
    name: 'recording.m4a',
    type: 'audio/mp4',
  };
}

/**
 * Transcribe an audio file URI to text using Sarvam Saaras v3.
 *
 * @param fileUri   Local file URI returned by expo-audio after recording stops
 * @param languageCode  BCP-47 code, defaults to 'hi-IN'
 * @returns         The transcript string
 */
import axios from 'axios';

export async function transcribeAudio(
  fileUri: string,
  languageCode = 'hi-IN'
): Promise<string> {
  if (!SARVAM_KEY) {
    throw new Error(
      'EXPO_PUBLIC_SARVAM_KEY is not set. Add it to your .env file.'
    );
  }

  const form = new FormData();
  const fileMeta = getAudioFileMeta(fileUri);

  form.append('file', {
    uri: fileUri,
    name: fileMeta.name,
    type: fileMeta.type,
  } as any);
  form.append('model', 'saaras:v3');
  form.append('language_code', languageCode);
  form.append('mode', 'transcribe');

  const response = await axios.post(SARVAM_STT_URL, form, {
    headers: {
      'api-subscription-key': SARVAM_KEY,
    },
  });

  const data = response.data as SarvamTranscribeResponse;
  const transcript = data.transcript ?? data.text;

  if (!transcript) {
    throw new Error('Sarvam STT returned an empty transcript.');
  }

  return transcript.trim();
}

/**
 * Convert text to speech using Sarvam Bulbul v3 and persist the returned WAV.
 *
 * @param text Text to synthesize
 * @param targetLanguageCode BCP-47 code, defaults to 'hi-IN'
 * @returns Local file URI for playback
 */
export async function synthesizeSpeech(
  text: string,
  targetLanguageCode = 'hi-IN'
): Promise<string> {
  if (!SARVAM_KEY) {
    throw new Error(
      'EXPO_PUBLIC_SARVAM_KEY is not set. Add it to your .env file.'
    );
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('Cannot synthesize empty text.');
  }

  const response = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: {
      'api-subscription-key': SARVAM_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: trimmedText,
      target_language_code: targetLanguageCode,
      model: 'bulbul:v3',
      output_audio_codec: 'wav',
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Sarvam TTS error ${response.status}: ${body || response.statusText}`
    );
  }

  const data = (await response.json()) as SarvamTextToSpeechResponse;
  const audioBase64 = data.audios?.[0];

  if (!audioBase64) {
    throw new Error('Sarvam TTS returned no audio.');
  }

  const audioFile = new File(Paths.cache, `sarvam-reply-${Date.now()}.wav`);
  audioFile.create({ overwrite: true });
  audioFile.write(audioBase64, { encoding: EncodingType.Base64 });

  return audioFile.uri;
}
