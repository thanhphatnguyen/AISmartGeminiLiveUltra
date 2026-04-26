import { requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";
import { Alert } from "react-native";
import {
  AudioBuffer,
  AudioContext,
  AudioRecorder,
} from "react-native-audio-api";

class AudioStreamService {
  private audioContext: AudioContext | null = null;
  private audioRecorder: AudioRecorder | null = null;
  public isStreaming: boolean = false;

  /**
   * Khởi động luồng thu âm
   */
  public async startStreaming(
    sampleRate: number,
    interval: number,
    onAudioChunkReady: (base64Chunk: string) => void
  ) {
    if (this.isStreaming) return;

    const permissionResult = await requestRecordingPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Error", "Cần quyền truy cập Microphone để dịch thuật.");
      return;
    }

    try {
      // 👇 KHÚC CẤU HÌNH BÍ MẬT CHO iOS & ANDROID CHẠY NGẦM 👇
      await setAudioModeAsync({
        allowsRecording: true,          // Bắt buộc để được thu âm
        playsInSilentMode: true,        // Gạt nút im lặng vẫn nghe được AI nói
        shouldPlayInBackground: true,   // Cho phép sống dai khi tắt màn hình
        interruptionMode: "doNotMix",   // Độc quyền audio trên iOS
        interruptionModeAndroid: "doNotMix", // Độc quyền audio trên Android
      });
      // 👆 XONG KHÚC CẤU HÌNH 👆

      this.audioContext = new AudioContext({ sampleRate });
      this.audioRecorder = new AudioRecorder({
        sampleRate: sampleRate,
        bufferLengthInSamples: (sampleRate * interval) / 1000,
      });

      const recorderAdapterNode = this.audioContext.createRecorderAdapter();
      this.audioRecorder.connect(recorderAdapterNode);

      this.audioRecorder.onAudioReady((event) => {
        const base64Chunk = this.convertAudioBufferToBase64(event.buffer);
        onAudioChunkReady(base64Chunk);
      });

      this.audioRecorder.start();
      this.isStreaming = true;
      console.log("🎙️ [AudioStreamService] Đã bắt đầu thu âm.");
    } catch (error) {
      console.error("❌ [AudioStreamService] Lỗi khởi tạo thu âm:", error);
    }
  }

  /**
   * Dừng thu âm
   */
  public stopStreaming() {
    this.isStreaming = false;
    try {
      this.audioRecorder?.stop();
      this.audioContext = null;
      this.audioRecorder = null;
      console.log("⏹️ [AudioStreamService] Đã dừng thu âm.");
    } catch (e) {
      console.warn("⚠️ [AudioStreamService] Lỗi khi dừng:", e);
    }
  }

  /**
   * Chuyển đổi AudioBuffer sang Base64 PCM 16-bit
   * Copy từ logic trong index.tsx
   */
  private convertAudioBufferToBase64(audioBuffer: AudioBuffer): string {
    const float32Array = audioBuffer.getChannelData(0);
    const pcmData = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      pcmData[i] = Math.round(sample * 32767);
    }

    const bytes = new Uint8Array(pcmData.buffer);
    let binary = "";
    const chunkSize = 0x8000; 
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    return btoa(binary);
  }
}

export const audioStreamService = new AudioStreamService();