import React, { useEffect } from 'react';
import { View } from "react-native";
import Orientation from 'react-native-orientation-locker';
import { useFilePermission } from '../components/FilePermissionContext';
import { PDFList } from "../components/PDFList";
import { PermissionGate } from "../components/PermissionGate";

export default function Index() {
  const { isReady } = useFilePermission();
  
  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  return (
    <PermissionGate>
      <View className="flex-1 bg-gray-50 p-4">
        <PDFList />
      </View>
    </PermissionGate>
  );
}
