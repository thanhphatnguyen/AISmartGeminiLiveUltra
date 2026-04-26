import React from "react";
import { Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Đã thêm AndroidForegroundServiceType ở đây 👇
import notifee, { AndroidImportance, AndroidForegroundServiceType } from '@notifee/react-native';
import { stopBackgroundServices, backgroundTranslationTask } from '@/services/BackgroundTranslationTask';

notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    console.log("🚀 [Notifee Task] Bắt đầu chạy ngầm vô tận...");
    backgroundTranslationTask();
  });
});

const New = () => {

  const startBackgroundTranslation = async () => {
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
          // 👇 DÙNG ENUM CHUẨN CỦA NOTIFEE 👇
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