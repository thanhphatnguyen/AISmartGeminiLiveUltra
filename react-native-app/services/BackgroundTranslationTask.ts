// Đường dẫn: react-native-app/services/BackgroundTranslationTask.ts

import { audioStreamService } from './AudioStreamService';
import { geminiSocketService } from './GeminiSocketService';
import { audioPlayerService } from './AudioPlayerService';

// TODO: Đổi thành IP local hoặc ngrok URL của bạn
const localIpAddress = "https://wedded-dovie-uninstructedly.ngrok-free.dev"; 

export const TASK_NAME = "TranslationBackgroundTask";

// 1. HÀM CHÍNH: KHỞI ĐỘNG CHẠY NGẦM
export const backgroundTranslationTask = async (taskData?: any) => {
  console.log("🚀 [BackgroundTask] Bắt đầu quá trình dịch thuật ngầm...");

  try {
    // Bước 1: Lấy Token từ server Express (app.js)
    console.log("🔄 [BackgroundTask] Đang lấy token...");
    const response = await fetch(`${localIpAddress}/session`);
    const data = await response.json();
    const ephemeralKey = data.token.name;
    console.log("✅ [BackgroundTask] Đã có token, chuẩn bị kết nối Gemini!");

    // Bước 2: Lắng nghe kết quả từ AI và phát ra loa
    geminiSocketService.onAudioResponseComplete = (base64Audio) => {
      // AI trả về sample rate mặc định là 24000
      audioPlayerService.play(base64Audio, 24000);
    };

    // Bước 3: Kết nối WebSocket với Gemini
    await geminiSocketService.connect(ephemeralKey);

    // Bước 4: Chờ Gemini Setup xong, sau đó BẬT MIC thu âm
    const checkSetup = setInterval(() => {
      if (geminiSocketService.isInitialized) {
        clearInterval(checkSetup); // Ngừng kiểm tra khi đã setup xong

        console.log("🎙️ [BackgroundTask] AI đã sẵn sàng. Bắt đầu nghe...");
        
        audioStreamService.startStreaming(
          16000, // sampleRate thu âm
          250,   // interval: cắt mảng 250ms một lần
          (base64Chunk) => {
            // Liên tục bắn các đoạn thu âm nhỏ lên Server Gemini
            // AI (model gemini-3.1-flash-live-preview) sẽ tự nghe và dịch
            geminiSocketService.sendAudioChunk(base64Chunk);
          }
        );
      }
    }, 500); // Mỗi 0.5s kiểm tra 1 lần xem websocket đã 'isInitialized' chưa

  } catch (error) {
    console.error("❌ [BackgroundTask] Lỗi hệ thống:", error);
  }

  // Giữ cho tiến trình chạy ngầm này sống vô tận bằng một Promise không bao giờ kết thúc
  return new Promise(() => {});
};

// 2. HÀM DỌN DẸP: GỌI KHI BẤM "DỪNG CHẠY NGẦM"
export const stopBackgroundServices = () => {
  audioStreamService.stopStreaming();
  geminiSocketService.disconnect();
  audioPlayerService.stop();
  console.log("⏹️ [BackgroundTask] Đã dọn dẹp sạch sẽ Mic, Loa và Socket!");
};