import * as MediaLibrary from 'expo-media-library';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';

interface FilePermissionContextType {
  hasFilePermission: boolean;
  isReady: boolean;
  checkFilePermission: () => Promise<void>;
  requestFilePermission: () => Promise<void>;
}

const FilePermissionContext = createContext<FilePermissionContextType | undefined>(undefined);

export const useFilePermission = () => {
  const context = useContext(FilePermissionContext);
  if (!context) {
    throw new Error('useFilePermission must be used within a FilePermissionProvider');
  }
  return context;
};

export const FilePermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasFilePermission, setHasFilePermission] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const checkFilePermission = async () => {
    try {
      let granted = false;
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status === 'granted') {
        granted = true;
      }
      setHasFilePermission(granted);
    } catch (error) {
      setHasFilePermission(false);
    } finally {
      setIsReady(true);
    }
  };

  const requestFilePermission = async () => {
    try {
      let granted = false;
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted' && canAskAgain) {
        const { status: reqStatus } = await MediaLibrary.requestPermissionsAsync();
        if (reqStatus === 'granted') {
          granted = true;
        }
      } else if (status === 'granted') {
        granted = true;
      }
      setHasFilePermission(granted);
      if (!granted) {
        Alert.alert(
          'Dosya İzni Gerekli',
          'Bu uygulama dosyalara erişim izni gerektirir. Lütfen ayarlardan izin verin.',
          [
            { text: 'Ayarlar', onPress: () => Linking.openSettings() },
            { text: 'İptal', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      setHasFilePermission(false);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    checkFilePermission();
  }, []);

  return (
    <FilePermissionContext.Provider value={{
      hasFilePermission,
      isReady,
      checkFilePermission,
      requestFilePermission
    }}>
      {children}
    </FilePermissionContext.Provider>
  );
}; 