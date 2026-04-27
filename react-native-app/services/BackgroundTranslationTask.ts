// Đường dẫn: react-native-app/services/BackgroundTranslationTask.ts

import { audioStreamService } from './AudioStreamService';
import { geminiSocketService } from './GeminiSocketService';
import { audioPlayerService } from './AudioPlayerService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TASK_NAME = "TranslationBackgroundTask";

const SETTINGS_KEYS = {
  API_KEY: "settings_api_key",
  MODEL: "settings_model",
  PROMPT: "settings_prompt",
};

const DEFAULT_SETTINGS = {
  apiKey: "",
  model: "gemini-3.1-flash-live-preview",
  prompt: "Bạn là một thông dịch viên, khi nghe tiếng Đức hãy phiên dịch sang tiếng Việt, không nói gì thêm, không giải thích gì thêm!",
};

// 1. HÀM CHÍNH: KHỞI ĐỘNG CHẠY NGẦM
export const backgroundTranslationTask = async (taskData?: any) => {
  console.log("🚀 [BackgroundTask] Bắt đầu quá trình dịch thuật ngầm...");

  try {
    // Đọc settings từ AsyncStorage
    const savedApiKey = await AsyncStorage.getItem(SETTINGS_KEYS.API_KEY);
    const savedModel = await AsyncStorage.getItem(SETTINGS_KEYS.MODEL);
    const savedPrompt = await AsyncStorage.getItem(SETTINGS_KEYS.PROMPT);

    const apiKey = (savedApiKey && savedApiKey.trim()) ? savedApiKey.trim() : DEFAULT_SETTINGS.apiKey;
    const model = (savedModel && savedModel.trim()) ? savedModel.trim() : DEFAULT_SETTINGS.model;
    const prompt = (savedPrompt && savedPrompt.trim()) ? savedPrompt.trim() : DEFAULT_SETTINGS.prompt;

    if (!apiKey) {
      console.error("❌ [BackgroundTask] Chưa có API Key! Vào Settings để nhập.");
      return;
    }

    console.log(`📋 [BackgroundTask] Model: ${model}`);
    console.log(`📋 [BackgroundTask] Prompt: ${prompt.substring(0, 60)}...`);

    // Bước 1: Lắng nghe kết quả từ AI và phát ra loa
    geminiSocketService.onAudioResponseComplete = (base64Audio) => {
      audioPlayerService.play(base64Audio, 24000);
    };

    // Bước 2: Kết nối thẳng WebSocket tới Gemini bằng API key
    await geminiSocketService.connect(apiKey, model, prompt);

    // Bước 3: Chờ Gemini Setup xong, sau đó BẬT MIC thu âm
    const checkSetup = setInterval(() => {
      if (geminiSocketService.isInitialized) {
        clearInterval(checkSetup);

        console.log("🎙️ [BackgroundTask] AI đã sẵn sàng. Bắt đầu nghe...");

        audioStreamService.startStreaming(
          16000,
          250,
          (base64Chunk) => {
            geminiSocketService.sendAudioChunk(base64Chunk);
          }
        );
      }
    }, 500);

  } catch (error) {
    console.error("❌ [BackgroundTask] Lỗi hệ thống:", error);
  }

  // Giữ cho tiến trình chạy ngầm này sống vô tận
  return new Promise(() => {});
};

// 2. HÀM DỌN DẸP: GỌI KHI BẤM "DỪNG CHẠY NGẦM"
export const stopBackgroundServices = () => {
  audioStreamService.stopStreaming();
  geminiSocketService.disconnect();
  audioPlayerService.stop();
  console.log("⏹️ [BackgroundTask] Đã dọn dẹp sạch sẽ Mic, Loa và Socket!");
};