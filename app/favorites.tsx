import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View } from "react-native";
import Orientation from 'react-native-orientation-locker';
import { FavoritePDFList } from "../components/FavoritePDFList";

export default function Favorites() {
  useEffect(() => {
    Orientation.lockToPortrait();
    SplashScreen.hideAsync();
  }, []);

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <FavoritePDFList />
    </View>
  );
} 