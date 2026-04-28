import React, { useState, useEffect } from "react";
import {
  Button,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,              // 👈 CẦN ĐỂ HIỆN POPUP
  DeviceEventEmitter  // 👈 CẦN ĐỂ NGHE BÁO LỖI TỪ SOCKET
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee, { AndroidImportance, AndroidForegroundServiceType } from '@notifee/react-native';
import { stopBackgroundServices, backgroundTranslationTask } from '@/services/BackgroundTranslationTask';

notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    console.log("🚀 [Notifee Task] Bắt đầu chạy ngầm vô tận...");
    backgroundTranslationTask();
  });
});

export const SETTINGS_KEYS = {
  API_KEY: "settings_api_key",
  MODEL: "settings_model",
  PROMPT: "settings_prompt",
};

export const DEFAULT_SETTINGS = {
  apiKey: "",
  model: "gemini-3.1-flash-live-preview",
  prompt: "Bạn là một thông dịch viên, khi nghe tiếng Đức hãy phiên dịch sang tiếng Việt, không nói gì thêm, không giải thích gì thêm!",
};

const New = () => {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_SETTINGS.model);
  const [prompt, setPrompt] = useState(DEFAULT_SETTINGS.prompt);

  useEffect(() => {
    loadSettings();

    // 👉 LẮNG NGHE TÍN HIỆU LỖI TỪ TẦNG HẦM (Do file GeminiSocketService bắn lên)
    const errorListener = DeviceEventEmitter.addListener("API_ERROR", () => {
      Alert.alert("Lỗi Kết Nối", "Check API key bitten");
    });

    return () => {
      errorListener.remove(); // Dọn dẹp khi tắt màn hình
    };
  }, []);

  const loadSettings = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem(SETTINGS_KEYS.API_KEY);
      const savedModel = await AsyncStorage.getItem(SETTINGS_KEYS.MODEL);
      const savedPrompt = await AsyncStorage.getItem(SETTINGS_KEYS.PROMPT);

      if (savedApiKey !== null) setApiKey(savedApiKey);
      if (savedModel !== null) setModel(savedModel);
      if (savedPrompt !== null) setPrompt(savedPrompt);
    } catch (e) {
      console.error("❌ Lỗi đọc settings:", e);
    }
  };

  const saveSettings = async () => {
    // 👉 CHẶN: KHÔNG CHO LƯU NẾU API KEY BỊ TRỐNG
    if (!apiKey || apiKey.trim() === "") {
      Alert.alert("Thiếu thông tin", "Google API Key là bắt buộc, không được để trống!");
      return;
    }
	if (!model || model.trim() === "") {
      Alert.alert("Thiếu thông tin", "Google Model là bắt buộc, không được để trống!");
      return;
    }

    try {
      // 1. Lưu cấu hình vào bộ nhớ máy
      await AsyncStorage.setItem(SETTINGS_KEYS.API_KEY, apiKey);
      await AsyncStorage.setItem(SETTINGS_KEYS.MODEL, model);
      await AsyncStorage.setItem(SETTINGS_KEYS.PROMPT, prompt);
      
      // 2. Dừng ngay lập tức các dịch vụ chạy ngầm cũ
      stopBackgroundServices(); 
      
      // 3. Gỡ bỏ thông báo trên thanh trạng thái
      await notifee.stopForegroundService();

      console.log("✅ Đã lưu settings và dừng các tiến trình cũ.");
      
      setSettingsVisible(false);
      
    } catch (e) {
      console.error("❌ Lỗi lưu settings:", e);
    }
  };

  const startBackgroundTranslation = async () => {
    // 👉 CHẶN: YÊU CẦU NHẬP API KEY TRƯỚC KHI CHẠY
    if (!apiKey || apiKey.trim() === "") {
      Alert.alert("Yêu cầu", "Vui lòng nhập Google API Key trước khi bắt đầu!");
      setSettingsVisible(true); // Tự động mở bảng cài đặt
      return;
    }

    console.log("🚀 Yêu cầu bật dịch thuật chạy ngầm...");

    try {
      await notifee.requestPermission();

      const channelId = await notifee.createChannel({
        id: 'gemini_live_channel',
        name: 'AI Translation Service',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: '🎧 Gemini Live AI',
        body: 'Đang nghe và dịch thuật realtime 24/7...',
        android: {
          channelId,
          asForegroundService: true,
          ongoing: true,
        },
      });

      console.log("✅ Đã ra lệnh cho hệ thống bật Notifee!");
    } catch (error) {
      console.error("❌ Lỗi khi bật Notifee:", error);
    }
  };

  const stopBackgroundTranslation = async () => {
    console.log("⏹️ Yêu cầu tắt dịch thuật chạy ngầm...");
    stopBackgroundServices();
    await notifee.stopForegroundService();
  };

  return (
    <SafeAreaView
      className="self-stretch flex-1"
      edges={["top", "left", "right"]}
    >
      <View style={styles.container}>
        {/* Header row với nút Settings */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>🎧 AI Smart Gemini Live</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Nút điều khiển */}
        <View style={styles.buttonGroup}>
          <Button
            title="▶️ BẮT ĐẦU CHẠY NGẦM"
            color="#4CAF50"
            onPress={startBackgroundTranslation}
          />

          <Button
            title="⏹️ DỪNG CHẠY NGẦM"
            color="#F44336"
            onPress={stopBackgroundTranslation}
          />
        </View>

        <Text style={styles.hint}>
          (Tắt màn hình app vẫn sẽ nghe và dịch)
        </Text>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Cài đặt</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {/* API Key */}
              <Text style={styles.label}>
                🔑 Google API Key <Text style={{ color: "red" }}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Bắt buộc nhập API Key..."
                placeholderTextColor="#666"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Model */}
              <Text style={styles.label}>🤖 Model</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder="Nhập tên model..."
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {/* Prompt */}
              <Text style={styles.label}>💬 Prompt (System Instruction)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Nhập prompt hướng dẫn AI..."
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={5}
                textAlignVertical="top"
              />
            </ScrollView>

            {/* Nút lưu */}
            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
              <Text style={styles.saveButtonText}>💾 LƯU CÀI ĐẶT</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "relative",
    marginBottom: 4,
  },
  title: {
    color: "white",
    fontSize: 22,
    textAlign: "center",
    fontWeight: "600",
  },
  settingsButton: {
    position: "absolute",
    right: 0,
    padding: 8,
  },
  settingsIcon: {
    fontSize: 26,
  },
  buttonGroup: {
    width: "100%",
    gap: 16,
  },
  hint: {
    color: "gray",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    color: "#aaa",
    fontSize: 20,
    fontWeight: "600",
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#2a2a2a",
    color: "white",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#444",
  },
  inputMultiline: {
    minHeight: 120,
    paddingTop: 12,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
});

export default New;