// Đường dẫn: react-native-app/services/AudioPlayerService.ts
import { AudioContext, AudioBufferSourceNode } from "react-native-audio-api";

class AudioPlayerService {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  public async play(base64Text: string, sampleRate: number = 24000) {
    this.stop(); // Dừng bài cũ trước khi phát câu mới
    
    try {
      this.audioContext = new AudioContext({ sampleRate });
      const audioBuffer = await this.audioContext.decodePCMInBase64Data(base64Text);

      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.connect(this.audioContext.destination);
      this.sourceNode.buffer = audioBuffer;

      this.sourceNode.onEnded = () => { 
        this.stop(); 
      };
      
      this.sourceNode.start();
      console.log("🔊 [AudioPlayer] Đang phát AI trả lời...");
    } catch (e) {
      console.error("❌ [AudioPlayer] Lỗi phát âm thanh:", e);
    }
  }

  public stop() {
    try { 
      this.sourceNode?.stop(); 
    } catch (e) {}
    this.sourceNode = null;
  }
}

export const audioPlayerService = new AudioPlayerService();