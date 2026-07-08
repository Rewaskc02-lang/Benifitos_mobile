import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Palette } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import {
  notificationService,
  Notification,
} from "@/lib/api/services/notificationService";
import { apiClient } from "@/lib/api/client";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

const STORAGE_KEY = "@benefitos_notifications";

type Pref = { key: string; label: string; description: string };

const PREFS: Pref[] = [
  {
    key: "scheme_alerts",
    label: "New Scheme Alerts",
    description: "Notify when new government schemes match your profile",
  },
  {
    key: "document_reminders",
    label: "Document Reminders",
    description: "Remind you to upload or renew expiring documents",
  },
  {
    key: "weekly_digest",
    label: "Weekly Digest",
    description: "A weekly summary of your welfare score progress",
  },
  {
    key: "application_updates",
    label: "Application Updates",
    description: "Status changes on schemes you have applied for",
  },
  {
    key: "family_alerts",
    label: "Family Member Alerts",
    description: "Notify when new schemes are found for your household members",
  },
];

const DEFAULT: Record<string, boolean> = {
  scheme_alerts: true,
  document_reminders: true,
  weekly_digest: false,
  application_updates: true,
  family_alerts: true,
};

interface Props {
  onBack: () => void;
}

export function NotificationsScreen({ onBack }: Props) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"inbox" | "prefs">("inbox");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data.notifications);
    } catch (err: any) {
      console.warn("Failed to load notifications:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setPrefs(JSON.parse(val));
      setPrefsReady(true);
    });
    Promise.resolve().then(() => {
      fetchNotifications();
    });
  }, [user?.id, fetchNotifications]);

  useEffect(() => {
    const onBackPress = () => {
      onBack();
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => {
      subscription.remove();
    };
  }, [onBack]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const togglePref = (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      Alert.alert("Error", "Failed to mark notification as read.");
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      Alert.alert("Error", "Failed to mark all notifications as read.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      Alert.alert("Error", "Failed to delete notification.");
    }
  };

  const handleTriggerWorkflow = async () => {
    if (!user?.id) return;
    setTriggeringWorkflow(true);
    try {
      // Trigger POST /api/workflows/recalculate
      await apiClient.post("/api/workflows/recalculate", {
        citizenId: user.id,
      });
      Alert.alert(
        "Success",
        "Welfare score recalculation executed. Your inbox has been refreshed.",
      );
      await fetchNotifications();
    } catch {
      Alert.alert("Error", "Failed to trigger background calculation engine.");
    } finally {
      setTriggeringWorkflow(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "newly_eligible":
        return "🎉";
      case "missing_documents":
        return "📄";
      case "upcoming_eligibility":
        return "⏱️";
      default:
        return "🔔";
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={s.backBtn}
        >
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, activeTab === "inbox" && s.tabActive]}
          onPress={() => setActiveTab("inbox")}
        >
          <Text style={[s.tabText, activeTab === "inbox" && s.tabTextActive]}>
            Inbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === "prefs" && s.tabActive]}
          onPress={() => setActiveTab("prefs")}
        >
          <Text style={[s.tabText, activeTab === "prefs" && s.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          activeTab === "inbox" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Palette.primary}
            />
          ) : undefined
        }
      >
        {activeTab === "inbox" ? (
          <>
            {/* Quick trigger workflow action card */}
            <View style={s.workflowCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.workflowTitle}>Recalculation Engine</Text>
                <Text style={s.workflowDesc}>
                  Force live recalculations and refresh your score metrics.
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleTriggerWorkflow}
                disabled={triggeringWorkflow}
                style={[s.workflowBtn, triggeringWorkflow && { opacity: 0.6 }]}
              >
                {triggeringWorkflow ? (
                  <ActivityIndicator color={Palette.white} size="small" />
                ) : (
                  <Text style={s.workflowBtnText}>Recalculate</Text>
                )}
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  color: Palette.textMuted,
                  letterSpacing: 0.8,
                }}
              >
                Inbox messages
              </Text>
              {notifications.some((n) => !n.read) && (
                <TouchableOpacity
                  onPress={handleMarkAllRead}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: Palette.primary,
                    }}
                  >
                    Mark All Read
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={{ gap: 12 }}>
                {[1, 2, 3].map((item) => (
                  <View
                    key={item}
                    style={{
                      padding: 16,
                      borderRadius: 20,
                      backgroundColor: Palette.surface,
                      borderWidth: 1,
                      borderColor: Palette.border,
                      gap: 8,
                    }}
                  >
                    <SkeletonLoader height={18} width="35%" />
                    <SkeletonLoader height={14} width="80%" />
                  </View>
                ))}
              </View>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <View key={n.id} style={[s.notifCard, !n.read && s.unreadCard]}>
                  <View style={s.notifHeader}>
                    <View style={s.notifTypeRow}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>
                        {getIcon(n.type)}
                      </Text>
                      <Text style={s.notifTitle}>{n.title}</Text>
                    </View>
                    {!n.read && <View style={s.unreadDot} />}
                  </View>
                  <Text style={s.notifMsg}>{n.message}</Text>

                  <View style={s.notifActions}>
                    {!n.read && (
                      <TouchableOpacity
                        onPress={() => handleMarkRead(n.id)}
                        style={s.actionBtn}
                      >
                        <Text style={s.actionText}>Read ✓</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDelete(n.id)}
                      style={[s.actionBtn, { marginLeft: 12 }]}
                    >
                      <Text
                        style={[s.actionText, { color: Palette.recordingRed }]}
                      >
                        Delete 🗑
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>
                  All caught up! No notifications in your welfare network inbox.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={s.sectionTitle}>Preferences</Text>
            <View style={s.card}>
              {PREFS.map((pref, idx) => (
                <View
                  key={pref.key}
                  style={[
                    s.row,
                    idx < PREFS.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: Palette.border,
                    },
                  ]}
                >
                  <View style={s.rowText}>
                    <Text style={s.rowLabel}>{pref.label}</Text>
                    <Text style={s.rowDesc}>{pref.description}</Text>
                  </View>
                  <Switch
                    value={prefsReady ? prefs[pref.key] : false}
                    onValueChange={() => togglePref(pref.key)}
                    trackColor={{
                      false: Palette.border,
                      true: Palette.primaryA55,
                    }}
                    thumbColor={
                      prefs[pref.key] ? Palette.primary : Palette.textMuted
                    }
                    ios_backgroundColor={Palette.border}
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backIcon: { color: Palette.textSecondary, fontSize: 22 },
  title: {
    flex: 1,
    textAlign: "center",
    color: Palette.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Palette.surface,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  tabActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  tabText: { color: Palette.textSecondary, fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: Palette.white },
  body: { padding: 20, paddingBottom: 60 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: Palette.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  workflowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    marginBottom: 20,
  },
  workflowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.textPrimary,
    marginBottom: 4,
  },
  workflowDesc: { fontSize: 12, color: Palette.textSecondary, marginRight: 12 },
  workflowBtn: {
    backgroundColor: Palette.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  workflowBtnText: { color: Palette.white, fontSize: 12, fontWeight: "700" },
  notifCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    marginBottom: 12,
  },
  unreadCard: {
    borderColor: Palette.primary,
    borderLeftWidth: 4,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  notifTypeRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  notifTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Palette.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.primary,
    marginRight: 4,
  },
  notifMsg: {
    fontSize: 13,
    color: Palette.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  notifActions: { flexDirection: "row", justifyContent: "flex-end" },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  actionText: { fontSize: 12, fontWeight: "600", color: Palette.primary },
  emptyCard: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: Palette.textSecondary,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowText: { flex: 1, marginRight: 16 },
  rowLabel: {
    color: Palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  rowDesc: { color: Palette.textSecondary, fontSize: 12, lineHeight: 17 },
});
