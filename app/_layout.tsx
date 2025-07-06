import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FavoriteProvider } from "../components/FavoriteContext";
import { FilePermissionProvider, useFilePermission } from "../components/FilePermissionContext";
import "../global.css";

// Splash screen'i otomatik gizlemeyi engelle
SplashScreen.preventAutoHideAsync();

export default function RootLayoutWrapper() {
  return (
    <FilePermissionProvider>
      <RootLayout />
    </FilePermissionProvider>
  );
}

function RootLayout() {
  const { hasFilePermission, isReady, requestFilePermission } = useFilePermission();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Burada gerekli veri yüklemeleri yapılabilir
        // Örneğin: fontlar, assetler, API çağrıları vb.
        
        // Şimdilik sadece kısa bir gecikme
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('prepare error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  if (!hasFilePermission) {
    return (
      <View onLayout={onLayoutRootView} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 32 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ef4444', marginBottom: 16, textAlign: 'center' }}>
          Dosya erişim izni gerekli
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Ionicons name={hasFilePermission ? 'checkmark-circle' : 'close-circle'} size={28} color={hasFilePermission ? '#22c55e' : '#ef4444'} style={{ marginRight: 8 }} />
          <Text style={{ color: hasFilePermission ? '#22c55e' : '#ef4444', fontWeight: 'bold', fontSize: 16 }}>
            Dosya Erişim İzni: {hasFilePermission ? 'Verildi' : 'Verilmedi'}
          </Text>
        </View>
        <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
          Uygulamayı kullanabilmek için dosya erişim izni vermeniz gerekmektedir.
        </Text>
        <TouchableOpacity
          onPress={requestFilePermission}
          style={{ backgroundColor: '#ef4444', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>İzin İste</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
      <FavoriteProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#ef4444",
            tabBarInactiveTintColor: "#6b7280",
            tabBarStyle: {
              backgroundColor: "#ffffff",
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "500",
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Ana Sayfa",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="favorites"
            options={{
              title: "Favoriler",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="heart" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="pdf-viewer"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="excel-viewer"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </FavoriteProvider>
    </View>
  );
}
