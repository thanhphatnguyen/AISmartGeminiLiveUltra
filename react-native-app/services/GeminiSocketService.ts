import {
  type LiveServerMessage,
  type LiveClientMessage,
  type UsageMetadata,
} from "@google/genai";
import { Buffer } from "buffer";
import { Alert } from "react-native"; // 👈 LÔI THẲNG GIAO DIỆN POPUP VÀO ĐÂY

class GeminiSocketService {
  private ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public isInitialized: boolean = false;
  public isAiResponding: boolean = false;
  private responseQueue: string[] = [];

  // Callbacks để thông báo về UI hoặc Task
  public onAudioResponseComplete?: (base64Audio: string) => void;
  public onMessageReceived?: (message: LiveServerMessage) => void;
  public onUsageReport?: (usage: UsageMetadata) => void;
  public onSocketError?: (error: any) => void;
  public onSocketClosed?: () => void; // Callback cho vụ rớt mạng 10 phút

  /**
   * Kết nối tới Gemini Live API bằng API key trực tiếp
   */
  public async connect(apiKey: string, model: string, prompt: string) {
    if (this.ws) return;

    // Dùng ?key= thay vì ?access_token= khi kết nối bằng API key thông thường
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("🌐 [GeminiSocket] Đã kết nối.");
      this.isConnected = true;

      // Gửi config ban đầu kèm model và system instruction (prompt)
      const setupMessage: LiveClientMessage = {
        setup: {
          model: `models/${model}`,
          systemInstruction: {
            parts: [{ text: prompt }],
          },
          generationConfig: {
            responseModalities: ["AUDIO"],
          },
        },
      };
      this.ws?.send(JSON.stringify(setupMessage));
    };

    this.ws.onclose = () => {
      console.log("🌐 [GeminiSocket] Đã ngắt kết nối.");

      // 👉 BẮT BỆNH: Mở rồi nhưng đóng liền chưa kịp Setup -> Sai API Key
      if (this.isConnected && !this.isInitialized) {
        console.log("❌ Bị ngắt kết nối đột ngột! Do sai API Key.");
        
        // 💥 BẮN THẲNG POPUP GIAO DIỆN RA MÀN HÌNH!
        Alert.alert("Lỗi", "Check API key bitten"); 
        
        this.onSocketError?.("API_KEY_INVALID");
      } else {
        // Trường hợp rớt mạng bình thường (ví dụ quá 10 phút)
        this.onSocketClosed?.();
      }

      this.resetState();
    };

    this.ws.onerror = (e) => {
      console.error("❌ [GeminiSocket] Lỗi WebSocket:", e);
      this.onSocketError?.(e);
    };

    this.ws.onmessage = async (event) => {
      try {
        const text = typeof event.data === "string" ? event.data : await this.blobToText(event.data);
        if (!text.trim()) return;

        const message: LiveServerMessage = JSON.parse(text);
        this.onMessageReceived?.(message);

        // Xử lý Setup
        if (message.setupComplete) {
          this.isInitialized = true;
          console.log("✅ [GeminiSocket] Setup hoàn tất.");
        }

        // Xử lý Audio Chunk từ AI
        const parts = message?.serverContent?.modelTurn?.parts;
        if (parts) {
          this.isAiResponding = true;
          for (const part of parts) {
            if (part?.inlineData?.data) {
              this.responseQueue.push(part.inlineData.data);
            }
          }
        }

        // Xử lý khi hoàn tất câu trả lời
        if (message?.serverContent?.generationComplete) {
          this.isAiResponding = false;
          const fullAudio = this.combineBase64ArrayList(this.responseQueue);
          this.responseQueue = [];
          this.onAudioResponseComplete?.(fullAudio);
        }

        if (message?.usageMetadata) {
          this.onUsageReport?.(message.usageMetadata);
        }
      } catch (err) {
        console.error("❌ [GeminiSocket] Lỗi xử lý message:", err);
      }
    };
  }

  public sendAudioChunk(base64String: string) {
    if (this.ws && this.isConnected && this.isInitialized) {
      const message: LiveClientMessage = {
        realtimeInput: {
          audio: {
            data: base64String,
            mimeType: "audio/pcm;rate=16000",
          },
        },
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  public disconnect() {
    this.ws?.close();
    this.resetState();
  }

  private resetState() {
    this.ws = null;
    this.isConnected = false;
    this.isInitialized = false;
    this.isAiResponding = false;
    this.responseQueue = [];
  }

  private async blobToText(data: any): Promise<string> {
    if (data instanceof Blob) return await data.text();
    if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
    return "";
  }

  /**
   * Gộp các mảng Base64 PCM
   */
  private combineBase64ArrayList(base64Array: string[]): string {
    const pcmChunks = base64Array.map((b64) => {
      const buf = Buffer.from(b64, "base64");
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    });

    const totalLength = pcmChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of pcmChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    return Buffer.from(combined.buffer).toString("base64");
  }
}

export const geminiSocketService = new GeminiSocketService();