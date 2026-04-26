import React from "react";
import { Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Giả định bạn sẽ dùng một thư viện quản lý Foreground Service (VD: @supersami/rn-foreground-service)
import ForegroundService from 'react-native-foreground-service'; 
import { stopBackgroundServices } from '@/services/BackgroundTranslationTask';

const New = () => {

  const startBackgroundTranslation = () => {
    console.log("🚀 Yêu cầu bật dịch thuật chạy ngầm...");
    // Kích hoạt Notification dính cứng trên Android để app không bị OS "trảm"
    ForegroundService.startService({
      id: 144,
      title: "Gemini Live AI",
      message: "Đang nghe và dịch thuật realtime 24/7...",
      icon: "ic_launcher", 
      button: false,
    });
  };

  const stopBackgroundTranslation = () => {
    console.log("⏹️ Yêu cầu tắt dịch thuật chạy ngầm...");
	stopBackgroundServices(); // <-- Đập chết mic, loa và socket
    ForegroundService.stopService();
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