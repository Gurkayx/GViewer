import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from './FavoriteContext';

export const FavoritePDFList: React.FC = () => {
  const { favoritePDFs, removeFromFavorites } = useFavorites();
  const router = useRouter();

  const openPDF = async (file: any) => {
    try {
      // Dosyanın hala var olup olmadığını kontrol et
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (!fileInfo.exists) {
        Alert.alert('Hata', 'Dosya bulunamadı. Dosya silinmiş olabilir.');
        // Dosyayı favorilerden kaldır
        removeFromFavorites(file.id);
        return;
      }
      const fileType = getFileType(file);
      if (fileType === 'xlsx') {
        router.push({
          pathname: '/excel-viewer',
          params: {
            uri: file.uri,
            name: file.name
          }
        });
      } else {
        router.push({
          pathname: '/pdf-viewer',
          params: {
            uri: file.uri,
            name: file.name
          }
        });
      }
    } catch (error) {
      console.error('Dosya açma hatası:', error);
      Alert.alert('Hata', 'Dosya açılırken bir hata oluştu.');
    }
  };

  const deleteFavorite = (id: string, name: string) => {
    Alert.alert(
      'Favoriden Kaldır',
      `"${name}" dosyasını favorilerden kaldırmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => removeFromFavorites(id)
        }
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: any) => {
    if (file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (file.name.toLowerCase().endsWith('.xlsx')) return 'xlsx';
    return 'other';
  };

  const renderFavoriteItem = ({ item }: { item: any }) => {
    const fileType = getFileType(item);
    if (fileType === 'xlsx') {
      // XLSX için yeşil kart tasarımı
      return (
        <View className="bg-green-50 rounded-2xl p-5 mb-4 shadow-lg border border-green-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-3">
                <View className="bg-green-200 rounded-xl p-2 mr-3">
                  <Ionicons name="logo-microsoft" size={24} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-green-800 mb-1" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="#16a34a" />
                    <Text className="text-green-700 text-sm ml-1">
                      {item.lastModified.toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="hardware-chip-outline" size={16} color="#16a34a" />
                  <Text className="text-green-700 text-sm ml-1">
                    {formatFileSize(item.size)}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row ml-3">
              <TouchableOpacity
                onPress={() => openPDF(item)}
                className="bg-green-500 p-3 rounded-xl mr-2 shadow-sm"
                style={{ elevation: 3 }}
              >
                <Ionicons name="eye" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteFavorite(item.id, item.name)}
                className="bg-green-500 p-3 rounded-xl mr-2 shadow-sm"
                style={{ elevation: 3 }}
              >
                <Ionicons name="heart-dislike" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    // PDF için mevcut kırmızı kart tasarımı
    return (
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-lg border border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center mb-3">
              <View className="bg-red-50 rounded-xl p-2 mr-3">
                <Ionicons name="heart" size={24} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800 mb-1" numberOfLines={1}>
                  {item.name}
                </Text>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text className="text-gray-500 text-sm ml-1">
                    {item.lastModified.toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="hardware-chip-outline" size={16} color="#6b7280" />
                <Text className="text-gray-600 text-sm ml-1">
                  {formatFileSize(item.size)}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row ml-3">
            <TouchableOpacity
              onPress={() => openPDF(item)}
              className="bg-red-500 p-3 rounded-xl mr-2 shadow-sm"
              style={{ elevation: 3 }}
            >
              <Ionicons name="eye" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteFavorite(item.id, item.name)}
              className="bg-red-500 p-3 rounded-xl mr-2 shadow-sm"
              style={{ elevation: 3 }}
            >
              <Ionicons name="heart-dislike" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Dosya türlerine göre sayaç
  const pdfCount = favoritePDFs.filter(f => f.name.toLowerCase().endsWith('.pdf')).length;
  const xlsxCount = favoritePDFs.filter(f => f.name.toLowerCase().endsWith('.xlsx')).length;

  return (
    <SafeAreaView className="flex-1">
      {/* Modern Header */}
      <View className="bg-red-500 rounded-2xl p-5 mb-4 shadow-lg border border-gray-100">
        <View className="items-center mb-4">
          <View className="bg-white bg-opacity-20 rounded-full p-3 mb-3">
            <Ionicons name="heart" size={32} color="red" />
          </View>
          <View className="flex-row items-center justify-center gap-2">
            <Text className="text-white text-2xl font-bold text-center mb-1">
              Favori Dosyalarınız
            </Text>
          </View>
          <Text className="text-white text-opacity-90 text-center">
            {pdfCount} PDF, {xlsxCount} Excel dosyası favorilerde
          </Text>
        </View>
      </View>

      {favoritePDFs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <View className="bg-red-50 rounded-full p-6 mb-4 self-center">
              <Ionicons name="heart-outline" size={48} color="#ef4444" />
            </View>
            <Text className="text-gray-700 text-xl font-bold text-center mb-2">
              Henüz favori PDF'iniz yok
            </Text>
            <Text className="text-gray-500 text-center leading-6">
              PDF'leri favorilere eklemek için ana sayfaya gidin ve kalp ikonuna tıklayın
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={favoritePDFs}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}; 