import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Line } from 'react-native-svg';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  AudioQuality,
  createAudioPlayer,
  IOSOutputFormat,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { synthesizeSpeech, transcribeAudio } from '@/lib/api/services/sarvamService';
import { assistantService } from '@/lib/api/services/assistantService';
import { useAuthStore } from '@/store/authStore';
import { usePalette } from '@/store/themeStore';

const MIN_TYPING_MS = 600;

const RECORDING_OPTIONS = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac', sampleRate: 16000 },
  ios: { extension: '.m4a', outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.HIGH, sampleRate: 16000 },
  web: { mimeType: 'audio/mp4', bitsPerSecond: 64000 },
} as const;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SendIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MicIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={2} width={6} height={11} rx={3} stroke={color} strokeWidth={1.8} />
      <Path d="M5 10C5 13.31 7.69 16 11 16H13C16.31 16 19 13.31 19 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={12} y1={20} x2={12} y2={16} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={9} y1={22} x2={15} y2={22} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function BotIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={8} width={20} height={13} rx={3} stroke={color} strokeWidth={1.8} />
      <Path d="M8 21V8M16 21V8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 8V4M9 4H15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={8} cy={13} r={1.5} fill={color} />
      <Circle cx={16} cy={13} r={1.5} fill={color} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Animated typing dots
// ---------------------------------------------------------------------------

function TypingDots({ P }: { P: ReturnType<typeof usePalette> }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -6, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(450 - i * 150),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: P.textMuted,
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
    content: 'Hello! I am your BenefitOS AI Copilot.\n\nI can help you discover government schemes, understand your eligibility, navigate your welfare roadmap, and answer any questions about benefits available to you.\n\nHow can I assist you today?',
    timestamp: new Date(),
  },
];

const SUGGESTION_CHIPS = [
  'What benefits am I eligible for?',
  'Explain PM-KISAN scheme',
  'How do I improve my welfare score?',
  'What documents do I need?',
];

// ---------------------------------------------------------------------------
// AssistantScreen
// ---------------------------------------------------------------------------

export function AssistantScreen() {
  const { user } = useAuthStore();
  const P = usePalette();
  const tabBarHeight = useBottomTabBarHeight();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const audioPlayerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder);
  const isRecording = recorderState.isRecording;
  const recordPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      audioPlayerRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulse, { toValue: 1.4, duration: 500, useNativeDriver: true }),
          Animated.timing(recordPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordPulse.stopAnimation();
      recordPulse.setValue(1);
    }
  }, [isRecording]);

  const playReply = useCallback(async (text: string) => {
    try {
      const uri = await synthesizeSpeech(text, 'hi-IN');
      audioPlayerRef.current?.remove();
      const player = createAudioPlayer({ uri });
      audioPlayerRef.current = player;
      player.play();
    } catch {
      // silently skip TTS failures
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
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
        const [response] = await Promise.all([
          assistantService.ask({ question: text.trim(), citizenId: user?.id ?? 'citizen_101' }),
          new Promise<void>((r) => setTimeout(r, MIN_TYPING_MS)),
        ]);

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        void playReply(response.answer);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Unable to reach the server. Please check your connection and try again.',
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setIsTyping(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [isTyping, playReply, user?.id]
  );

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      setIsTranscribing(true);
      try {
        const transcript = await transcribeAudio(uri, 'hi-IN');
        setInputText(transcript);
        await sendMessage(transcript);
      } catch {
        // Transcription failed silently — user can type manually
      } finally {
        setIsTranscribing(false);
      }
    } else {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;
      await recorder.prepareToRecordAsync();
      recorder.record();
    }
  }, [isRecording, recorder, sendMessage]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: P.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? tabBarHeight : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: P.primary, borderBottomColor: P.primaryA30 }]}>
          <View style={[styles.botAvatar, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }]}>
            <BotIcon color="#FFFFFF" size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>BenefitOS Copilot</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={[styles.statusDot, { backgroundColor: isTyping ? '#FFC13B' : '#27AE60' }]} />
              <Text style={styles.headerStatus}>{isTyping ? 'Thinking...' : 'Online'}</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.role === 'user' ? styles.messageRowUser : styles.messageRowBot,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={[styles.avatarSmall, { backgroundColor: P.primaryA20, borderColor: P.primaryA30 }]}>
                  <BotIcon color={P.primary} size={14} />
                </View>
              )}
              <View style={{ maxWidth: '78%' }}>
                <View
                  style={[
                    styles.bubble,
                    msg.role === 'user'
                      ? { backgroundColor: P.primary, borderBottomRightRadius: 4 }
                      : {
                          backgroundColor: P.surface,
                          borderWidth: 1,
                          borderColor: msg.isError ? P.errorA30 : P.border,
                          borderBottomLeftRadius: 4,
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      {
                        color: msg.role === 'user'
                          ? P.white
                          : msg.isError
                            ? P.error
                            : P.textPrimary,
                      },
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.timestamp,
                    {
                      color: P.textMuted,
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                    },
                  ]}
                >
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageRow, styles.messageRowBot]}>
              <View style={[styles.avatarSmall, { backgroundColor: P.primaryA20, borderColor: P.primaryA30 }]}>
                <BotIcon color={P.primary} size={14} />
              </View>
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: P.surface,
                    borderWidth: 1,
                    borderColor: P.border,
                    borderBottomLeftRadius: 4,
                  },
                ]}
              >
                <TypingDots P={P} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestion chips — visible only before first user message */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
            style={[{ flexGrow: 0 }]}
          >
            {SUGGESTION_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => sendMessage(chip)}
                style={[styles.chip, { backgroundColor: P.surface, borderColor: P.primaryA30 }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: P.primary }]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            { backgroundColor: P.surface, borderTopColor: P.border, borderTopWidth: 1 },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: P.textPrimary }]}
            placeholder="Ask anything about government benefits..."
            placeholderTextColor={P.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
            editable={!isTyping}
          />

          {/* Mic */}
          <Animated.View style={{ transform: [{ scale: isRecording ? recordPulse : 1 }] }}>
            <TouchableOpacity
              onPress={toggleRecording}
              disabled={isTyping || isTranscribing}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isRecording
                    ? P.error
                    : isTranscribing
                      ? P.warning
                      : P.background,
                  borderColor: P.border,
                },
              ]}
              activeOpacity={0.8}
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color={P.white} />
              ) : (
                <MicIcon color={isRecording ? P.white : P.textMuted} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Send */}
          <TouchableOpacity
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping || isRecording}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  inputText.trim() && !isTyping && !isRecording ? P.primary : P.border,
              },
            ]}
            activeOpacity={0.85}
          >
            <SendIcon color={P.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  messageRow: {
    marginBottom: 14,
    gap: 8,
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
  },
  messageRowBot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 18,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
