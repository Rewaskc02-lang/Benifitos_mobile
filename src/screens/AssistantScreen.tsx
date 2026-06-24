import { synthesizeSpeech, transcribeAudio } from '@/lib/api/services/sarvamService';
import { Palette } from '@/constants/theme';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  AudioQuality,
  createAudioPlayer,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistantService } from '@/lib/api/services/assistantService';
import { useAuthStore } from '@/store/authStore';

const MIN_TYPING_MS = 500; // guaranteed minimum typing indicator duration

const RECORDING_OPTIONS = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: 16000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
    sampleRate: 16000,
  },
  web: {
    mimeType: 'audio/mp4',
    bitsPerSecond: 64000,
  },
} as const;

// ---------------------------------------------------------------------------
// Animated typing dots
// ---------------------------------------------------------------------------
function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(480 - i * 160),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: Palette.textSecondary,
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    role: 'assistant',
    content:
      "Hi! I'm your Benefitos AI Assistant 🤖\n\nI'm here to help you navigate your benefits, answer questions about your roadmap, and guide you through the platform. How can I help you today?",
    timestamp: new Date(),
  },
];

const SUGGESTION_CHIPS = [
  'What benefits do I have?',
  'Show my roadmap',
  'How do I enroll?',
  'Contact support',
];

export function AssistantScreen() {
  const { user } = useAuthStore();
  const tabBarHeight = useBottomTabBarHeight();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const assistantAudioPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  // ---------------------------------------------------------------------------
  // Audio recording — expo-audio SDK 56
  // ---------------------------------------------------------------------------
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder);
  const isRecording = recorderState.isRecording;

  // Animated pulse for the recording indicator
  const recordPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      assistantAudioPlayerRef.current?.remove();
      assistantAudioPlayerRef.current = null;
    };
  }, []);

  const playAssistantReply = useCallback(async (replyText: string) => {
    try {
      const audioUri = await synthesizeSpeech(replyText, 'hi-IN');
      assistantAudioPlayerRef.current?.remove();

      const player = createAudioPlayer({ uri: audioUri });
      assistantAudioPlayerRef.current = player;
      player.play();
    } catch (err) {
      console.warn('Assistant speech playback failed', err);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Run the API call and a minimum-delay timer in parallel;
      // whichever takes longer wins — guarantees ≥500ms typing indicator.
      const [response] = await Promise.all([
        assistantService.ask({ question: text.trim(), citizenId: user?.id ?? 'citizen_101' }),
        new Promise<void>((res) => setTimeout(res, MIN_TYPING_MS)),
      ]);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      void playAssistantReply(response.answer);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t reach the server. Please check your connection and try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [isTyping, playAssistantReply, user?.id]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulse, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(recordPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordPulse.stopAnimation();
      recordPulse.setValue(1);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // ── Stop recording ──────────────────────────────────────────────────
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;

      // Send the file to Sarvam STT
      setIsTranscribing(true);
      try {
        const transcript = await transcribeAudio(uri, 'hi-IN');
        // Drop the transcript into the input box, then fire the chat flow
        setInputText(transcript);
        await sendMessage(transcript);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Transcription failed', message);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // ── Start recording ─────────────────────────────────────────────────
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone permission required',
          'Please allow microphone access in your device settings to use voice input.'
        );
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
    }
  }, [isRecording, recorder, sendMessage]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // Account for the tab bar so the input clears the keyboard correctly.
        // On Android the tab bar hides when keyboard opens, so offset = 0.
        keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 items-center justify-center mr-3">
            <Text className="text-lg">🤖</Text>
          </View>
          <View className="flex-1">
            <Text className="text-text-primary text-lg font-bold">AI Assistant</Text>
            <View className="flex-row items-center">
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: isTyping ? '#F59E0B' : '#22C55E' }}
              />
              <Text className="text-text-secondary text-xs">
                {isTyping ? 'Thinking…' : 'Online'}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          // iOS 16+: automatically shrinks the scroll inset when the keyboard
          // appears so the last message stays visible without manual scrolling.
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`mb-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View
                style={{
                  maxWidth: '80%',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 20,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 20,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 20,
                  backgroundColor: msg.isError
                    ? Palette.errorA18
                    : msg.role === 'user'
                      ? Palette.primary
                      : Palette.surface,
                  borderWidth: msg.role === 'assistant' ? 1 : 0,
                  borderColor: msg.isError ? Palette.errorA44 : Palette.border,
                }}
              >
                <Text
                  style={{
                    color: msg.isError ? Palette.error : msg.role === 'user' ? Palette.white : Palette.textPrimary,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {msg.content}
                </Text>
              </View>
              <Text className="text-text-muted text-xs mt-1 mx-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}

          {isTyping && (
            <View className="items-start mb-4">
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderBottomLeftRadius: 4,
                  backgroundColor: Palette.surface,
                  borderWidth: 1,
                  borderColor: Palette.border,
                }}
              >
                <TypingDots />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestion Chips — shown until first user message */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            className="px-4 mb-3"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {SUGGESTION_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => sendMessage(chip)}
                className="rounded-full px-4 py-2 bg-background-card"
                style={{ borderWidth: 1, borderColor: Palette.primaryA44 }}
                activeOpacity={0.8}
              >
                <Text className="text-primary text-sm font-medium">{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Bar */}
        <View
          className="mx-4 mb-3 flex-row items-end rounded-2xl bg-background-card"
          style={{
            borderWidth: 1,
            borderColor: Palette.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <TextInput
            className="flex-1 text-text-primary text-sm"
            style={{ maxHeight: 100, paddingVertical: 6 }}
            placeholder="Ask me anything…"
            placeholderTextColor="#555577"
            value={inputText}
            onChangeText={setInputText}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
            editable={!isTyping}
          />
          {/* Mic button */}
          <TouchableOpacity
            onPress={toggleRecording}
            disabled={isTyping || isTranscribing}
            className="ml-2 w-9 h-9 rounded-xl items-center justify-center"
            style={{
              backgroundColor: isRecording
                ? Palette.recordingRed
                : isTranscribing
                  ? Palette.amber
                  : Palette.border,
            }}
            activeOpacity={0.8}
          >
            {isTranscribing ? (
              // Uploading to Sarvam — show a small spinner
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : isRecording ? (
              <Animated.View
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 5.5,
                  backgroundColor: '#FFFFFF',
                  transform: [{ scale: recordPulse }],
                }}
              />
            ) : (
              <Text style={{ color: Palette.textSecondary, fontSize: 16 }}>🎙</Text>
            )}
          </TouchableOpacity>

          {/* Send button */}
          <TouchableOpacity
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping || isRecording}
            className="ml-2 w-9 h-9 rounded-xl items-center justify-center"
            style={{
              backgroundColor: inputText.trim() && !isTyping && !isRecording ? Palette.primary : Palette.border,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
