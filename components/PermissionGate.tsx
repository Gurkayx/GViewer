import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useFilePermission } from './FilePermissionContext';

interface PermissionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  children, 
  fallback 
}) => {
  const { hasFilePermission, requestFilePermission } = useFilePermission();

  if (!hasFilePermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 w-full max-w-sm">
          <Text className="text-xl font-bold text-gray-800 text-center mb-2">
            Dosya İzni Gerekli
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Bu sayfayı görüntülemek için dosya erişim izni gereklidir. 
            Lütfen aşağıdaki butona tıklayarak izin verin.
          </Text>
          <TouchableOpacity
            onPress={requestFilePermission}
            className="bg-blue-500 py-3 px-6 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              İzin Ver
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}; 