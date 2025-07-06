import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from './FavoriteContext';

interface PDFFile {
  id: string;
  name: string;
  uri: string;
  size: number;
  lastModified: Date;
}

export const PDFList: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const router = useRouter();
  const { addToFavorites, isFavorite } = useFavorites();

  const STORAGE_KEY = '@gpdf_pdf_files';

  // Uygulama açıldığında kaydedilmiş PDF'leri yükle
  useEffect(() => {
    loadSavedPDFs();
  }, []);

  const loadSavedPDFs = async () => {
    try {
      setScanning(true);
      const savedPDFs = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedPDFs) {
        const parsedPDFs = JSON.parse(savedPDFs);
        // Date objelerini geri yükle
        const pdfsWithDates = parsedPDFs.map((pdf: any) => ({
          ...pdf,
          lastModified: new Date(pdf.lastModified)
        }));
        setPdfFiles(pdfsWithDates);
        console.log(`${pdfsWithDates.length} kaydedilmiş PDF yüklendi`);
      }
    } catch (error) {
      console.error('PDF yükleme hatası:', error);
    } finally {
      setScanning(false);
    }
  };

  const savePDFsToStorage = async (pdfs: PDFFile[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pdfs));
    } catch (error) {
      console.error('PDF kaydetme hatası:', error);
    }
  };

  const scanDevicePDFs = async () => {
    try {
      setScanning(true);
      
      // Sadece uygulama klasörlerini tara
      const directories = [
        { path: FileSystem.documentDirectory, name: 'Documents' },
        { path: FileSystem.cacheDirectory, name: 'Cache' },
      ];

      console.log('PDF tarama başlatılıyor...');
      let allPDFs: PDFFile[] = [];
      
      for (const dir of directories) {
        if (dir.path) {
          console.log(`${dir.name} klasörü taranıyor: ${dir.path}`);
          try {
            const pdfs = await scanDirectoryForPDFs(dir.path, dir.name);
            console.log(`${dir.name} klasöründe ${pdfs.length} PDF bulundu`);
            allPDFs = [...allPDFs, ...pdfs];
          } catch (error) {
            console.error(`${dir.name} klasörü tarama hatası:`, error);
          }
        }
      }

      // Mevcut PDF'lerle birleştir (duplicate'leri önle)
      setPdfFiles(prevFiles => {
        const existingIds = new Set(prevFiles.map(f => f.id));
        const newPDFs = allPDFs.filter(pdf => !existingIds.has(pdf.id));
        const updatedPDFs = [...prevFiles, ...newPDFs];
        savePDFsToStorage(updatedPDFs);
        return updatedPDFs;
      });

      console.log(`Toplam ${allPDFs.length} PDF dosyası bulundu`);
      
      if (allPDFs.length === 0) {
        console.log('Uygulama klasörlerinde PDF bulunamadı. Manuel seçim yapabilirsiniz.');
      }
    } catch (error) {
      console.error('PDF tarama hatası:', error);
    } finally {
      setScanning(false);
    }
  };

  const scanDirectoryForPDFs = async (directory: string, source: string): Promise<PDFFile[]> => {
    try {
      console.log(`Klasör okunuyor: ${directory}`);
      const files = await FileSystem.readDirectoryAsync(directory);
      console.log(`${directory} klasöründe ${files.length} dosya bulundu`);
      
      const pdfFiles: PDFFile[] = [];

      for (const file of files) {
        console.log(`Dosya kontrol ediliyor: ${file}`);
        if (file.toLowerCase().endsWith('.pdf')) {
          console.log(`PDF dosyası bulundu: ${file}`);
          const filePath = `${directory}${file}`;
          try {
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            console.log(`Dosya bilgisi:`, fileInfo);
            
            if (fileInfo.exists && fileInfo.size) {
              const pdfFile: PDFFile = {
                id: `${source}_${file}_${Date.now()}`,
                name: file,
                uri: filePath,
                size: fileInfo.size,
                lastModified: new Date(fileInfo.modificationTime || Date.now()),
              };
              pdfFiles.push(pdfFile);
              console.log(`PDF eklendi: ${file}`);
            } else {
              console.log(`Dosya mevcut değil veya boyut 0: ${file}`);
            }
          } catch (error) {
            console.error(`Dosya okuma hatası (${file}):`, error);
            continue;
          }
        }
      }

      return pdfFiles;
    } catch (error) {
      console.error(`${source} klasörü tarama hatası:`, error);
      return [];
    }
  };

  const pickPDF = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        ],
        multiple: true, // Çoklu seçim aktif
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPDFs: PDFFile[] = [];
        for (const file of result.assets) {
          // Dosyanın gerçekten var olup olmadığını kontrol et
          try {
            const fileInfo = await FileSystem.getInfoAsync(file.uri);
            if (!fileInfo.exists) {
              continue;
            }
            newPDFs.push({
              id: `manual_${file.name}_${Date.now()}_${Math.random()}`,
              name: file.name,
              uri: file.uri,
              size: file.size || 0,
              lastModified: new Date(),
            });
          } catch (error) {
            console.error('Dosya kontrol hatası:', error);
          }
        }
        if (newPDFs.length > 0) {
          const updatedPDFs = [...newPDFs, ...pdfFiles];
          setPdfFiles(updatedPDFs);
          savePDFsToStorage(updatedPDFs);
          Alert.alert('Başarılı', `${newPDFs.length} PDF dosyası eklendi!`);
        } else {
          Alert.alert('Hata', 'Seçilen dosyalar bulunamadı.');
        }
      }
    } catch (error) {
      console.error('PDF seçme hatası:', error);
      Alert.alert('Hata', 'PDF dosyası seçilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const deletePDF = async (id: string) => {
    Alert.alert(
      'PDF Sil',
      'Bu PDF dosyasını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            const updatedPDFs = pdfFiles.filter(file => file.id !== id);
            setPdfFiles(updatedPDFs);
            savePDFsToStorage(updatedPDFs);
          }
        }
      ]
    );
  };

  const openPDF = async (file: PDFFile) => {
    try {
      console.log('PDF açılıyor:', file);
      // Dosyanın hala var olup olmadığını kontrol et
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (!fileInfo.exists) {
        Alert.alert('Hata', 'Dosya bulunamadı. Dosya silinmiş olabilir.');
        // Dosyayı listeden kaldır
        const updatedPDFs = pdfFiles.filter(f => f.id !== file.id);
        setPdfFiles(updatedPDFs);
        savePDFsToStorage(updatedPDFs);
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

  const toggleFavorite = async (file: PDFFile) => {
    await addToFavorites(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: PDFFile) => {
    if (file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
    if (file.name.toLowerCase().endsWith('.xlsx')) return 'xlsx';
    return 'other';
  };

  const renderPDFItem = ({ item }: { item: PDFFile }) => {
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
                onPress={() => toggleFavorite(item)}
                className={`p-3 rounded-xl mr-2 shadow-sm ${
                  isFavorite(item.id) 
                    ? 'bg-green-900' 
                    : 'bg-white border border-green-500 shadow-sm'
                }`}
                style={{ elevation: 3 }}
              >
                <Ionicons 
                  name={isFavorite(item.id) ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isFavorite(item.id) ? "white" : "#16a34a"} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deletePDF(item.id)}
                className="bg-green-500 p-3 rounded-xl shadow-sm "
                style={{ elevation: 3 }}
              >
                <Ionicons name="trash" size={20} color="white" />
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
              <View className="bg-red-100 rounded-xl p-2 mr-3">
                <Ionicons name="document-text" size={24} color="#ef4444" />
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
              onPress={() => toggleFavorite(item)}
              className={`p-3 rounded-xl mr-2 shadow-sm ${
                isFavorite(item.id) 
                  ? 'bg-black' 
                  : 'bg-white border border-red-500 shadow-sm'
              }`}
              style={{ elevation: 3 }}
            >
              <Ionicons 
                name={isFavorite(item.id) ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorite(item.id) ? "white" : "#6b7280"} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deletePDF(item.id)}
              className="bg-red-500 p-3 rounded-xl shadow-sm "
              style={{ elevation: 3 }}
            >
              <Ionicons name="trash" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Dosya türlerine göre sayaç
  const pdfCount = pdfFiles.filter(f => f.name.toLowerCase().endsWith('.pdf')).length;
  const xlsxCount = pdfFiles.filter(f => f.name.toLowerCase().endsWith('.xlsx')).length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Modern Header */}
      <View className="bg-red-500 rounded-2xl p-5 mb-4 shadow-lg border border-gray-100">
        <View className="items-center mb-4">
          <View className="bg-white bg-opacity-20 rounded-full p-3 mb-3">
            <Ionicons name="library" size={32} color="red" />
          </View>
          <Text className="text-white text-2xl font-bold text-center mb-1">
            PDF Kütüphaneniz
          </Text>
          <Text className="text-white text-opacity-90 text-center">
            {pdfCount} PDF, {xlsxCount} Excel dosyası
          </Text>
        </View>
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={pickPDF}
            disabled={loading}
            className="flex-1 bg-red-950 bg-opacity-20 backdrop-blur-sm py-4 px-6 rounded-2xl flex-row items-center justify-center border border-white border-opacity-30"
            style={{ elevation: 5 }}
          >
            <Ionicons 
              name={loading ? "hourglass" : "add-circle"} 
              size={28} 
              color="white" 
            />
            <Text className="text-white font-bold text-lg ml-3">
              {loading ? 'Yükleniyor...' : 'PDF Seç'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={scanDevicePDFs}
            disabled={scanning}
            className="bg-red-950 bg-opacity-20 backdrop-blur-sm py-4 px-4 rounded-2xl flex-row items-center justify-center border border-white border-opacity-30"
            style={{ elevation: 5 }}
          >
            <Ionicons 
              name={scanning ? "refresh" : "refresh-circle"} 
              size={28} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {scanning && (
        <View className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-200">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className="text-blue-700 ml-3 font-semibold">
              PDF'ler yükleniyor...
            </Text>
          </View>
        </View>
      )}

      {pdfFiles.length === 0 && !scanning ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <View className="bg-gray-50 rounded-full p-6 mb-4 self-center">
              <Ionicons name="document-text-outline" size={48} className='bg-red-500 p-3 rounded-xl' color="white" />
            </View>
            <Text className="text-gray-700 text-xl font-bold text-center mb-2">
              Henüz PDF dosyası yok
            </Text>
            <Text className="text-gray-500 text-center leading-6">
              PDF dosyalarınızı görüntülemek ve yönetmek için yukarıdaki butona tıklayın
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={pdfFiles}
          renderItem={renderPDFItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}; 