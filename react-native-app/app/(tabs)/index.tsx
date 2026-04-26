import React from "react";
import { Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ForegroundService from '@supersami/rn-foreground-service';
import { stopBackgroundServices, backgroundTranslationTask } from '@/services/BackgroundTranslationTask';

const New = () => {

  const startBackgroundTranslation = async () => {
    console.log("🚀 Yêu cầu bật dịch thuật chạy ngầm...");
    
    ForegroundService.start({  // ✅ dùng .start() không phải .startService()
      id: 144,
      title: "Gemini Live AI",
      message: "Đang nghe và dịch thuật realtime 24/7...",
      icon: "ic_launcher",
      button: false,
	  serviceType: "microphone"
    });

    await backgroundTranslationTask(); // ✅ gọi task thực sự
  };

  const stopBackgroundTranslation = () => {
    console.log("⏹️ Yêu cầu tắt dịch thuật chạy ngầm...");
    stopBackgroundServices();
    ForegroundService.stop(); // ✅ dùng .stop()
  };

  return (
    <SafeAreaView
      className="self-stretch flex-1"
      edges={["top", "left", "right"]}
    >
      <View
        className="self-stretch flex-1"
        style={{
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          padding: 16,
        }}
      >
        <Text style={{ color: "white", fontSize: 24, textAlign: "center", marginBottom: 20 }}>
          🎧 AI Smart Gemini Live
        </Text>

        <View style={{ width: '100%', gap: 16 }}>
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

        <Text style={{ color: "gray", fontSize: 14, textAlign: "center", marginTop: 20 }}>
          (Tắt màn hình app vẫn sẽ nghe và dịch)
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default New;