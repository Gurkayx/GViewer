import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';

const PDFViewer: React.FC = () => {
  const { uri, name } = useLocalSearchParams<{ uri: string; name: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showGoToPage, setShowGoToPage] = useState(false);
  const [goToPageNumber, setGoToPageNumber] = useState('');
  const [targetPage, setTargetPage] = useState(1);
  const pdfRef = useRef<Pdf>(null);

  useEffect(() => {
    checkAndPreparePDF();
  }, [uri]);

  const checkAndPreparePDF = async () => {
    if (!uri) {
      setError('PDF URI bulunamadı');
      setLoading(false);
      return;
    }

    try {
      // URI'nin geçerli olup olmadığını kontrol et
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        setError('PDF dosyası bulunamadı');
        setLoading(false);
        return;
      }

      setPdfUri(uri);
      setLoading(false);
    } catch (err) {
      setError('PDF dosyası hazırlanırken hata oluştu');
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    setError('PDF dosyası yüklenirken bir hata oluştu: ' + error.message);
    setLoading(false);
  };

  const handleLoadComplete = (numberOfPages: number, filePath: string) => {
    setTotalPages(numberOfPages);
    setLoading(false);
  };

  const handlePageChanged = (page: number, numberOfPages: number) => {
    console.log(`Sayfa değişti: ${page}/${numberOfPages}`);
    setCurrentPage(page);
    setTotalPages(numberOfPages);
  };

  const goToFirstPage = () => {
    if (totalPages > 0) {
      setTargetPage(1);
      setCurrentPage(1);
    } else {
      Alert.alert('Hata', 'PDF henüz yüklenmedi.');
    }
    setShowMenu(false);
  };

  const goToLastPage = () => {
    if (totalPages > 0) {
      setTargetPage(totalPages);
      setCurrentPage(totalPages);
    } else {
      Alert.alert('Hata', 'PDF henüz yüklenmedi.');
    }
    setShowMenu(false);
  };

  const openGoToPageModal = () => {
    setShowMenu(false);
    setShowGoToPage(true);
  };

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPageNumber);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setTargetPage(pageNumber);
      setCurrentPage(pageNumber);
      setShowGoToPage(false);
      setGoToPageNumber('');
    } else {
      Alert.alert('Hata', `Lütfen 1 ile ${totalPages} arasında bir sayfa numarası girin.`);
    }
  };

  const goBack = () => {
    router.back();
  };

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    checkAndPreparePDF();
  };

  if (!uri) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <View className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <View className="bg-red-50 rounded-full p-6 mb-4 self-center">
            <Ionicons name="document-text-outline" size={48} color="#ef4444" />
          </View>
          <Text className="text-gray-700 text-xl font-bold text-center mb-2">
            PDF dosyası bulunamadı
          </Text>
          <TouchableOpacity
            onPress={goBack}
            className="bg-red-500 p-3 rounded-xl shadow-sm"
            style={{ elevation: 3 }}
          >
            <Text className="text-white font-bold text-center">Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Modern Header */}
      <View className="bg-red-500 rounded-2xl p-5 mb-4 shadow-lg border border-gray-100">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={goBack} 
            className="bg-white bg-opacity-20 rounded-full p-2"
            style={{ elevation: 3 }}
          >
            <Ionicons name="arrow-back" size={24} color="red" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center mx-4">
            <Text className="text-white font-bold text-lg text-center" numberOfLines={1}>
              {name || 'PDF Görüntüleyici'}
            </Text>
            {totalPages > 0 && (
              <View className="bg-red-950 bg-opacity-20 rounded-full px-3 py-1 mt-1">
                <Text className="text-white font-semibold text-sm">
                  {currentPage} / {totalPages}
                </Text>
              </View>
            )}
          </View>
          
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* PDF Content */}
      <View className="flex-1">
        {loading && (
          <View className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center bg-white z-10">
            <View className="bg-white rounded-3xl p-8 shadow-xl border border-red-500">
              <ActivityIndicator size="large" color="red" />
              <Text className="text-gray-600 mt-4 text-center font-semibold">PDF yükleniyor...</Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">Bu işlem biraz zaman alabilir</Text>
            </View>
          </View>
        )}

        {error ? (
          <View className="flex-1 items-center justify-center p-6">
            <View className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <View className="bg-red-50 rounded-full p-6 mb-4 self-center">
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
              </View>
              <Text className="text-red-500 text-lg font-bold text-center mb-4">{error}</Text>
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={retryLoad}
                  className="flex-1 bg-red-500 py-3 rounded-xl shadow-sm"
                  style={{ elevation: 3 }}
                >
                  <Text className="text-white font-bold text-center">Tekrar Dene</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goBack}
                  className="flex-1 bg-red-950 bg-opacity-20 ml-2 py-3 rounded-xl shadow-sm"
                  style={{ elevation: 3 }}
                >
                  <Text className="text-white font-bold text-center">Geri Dön</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : pdfUri ? (
          <Pdf
            ref={pdfRef}
            source={{ uri: pdfUri }}
            page={targetPage}
            onLoadComplete={handleLoadComplete}
            onError={handleError}
            onPageChanged={handlePageChanged}
            style={{ flex: 1 }}
            enablePaging={true}
            horizontal={false}
            enableAnnotationRendering={true}
            enableAntialiasing={true}
            trustAllCerts={false}
          />
        ) : null}
      </View>

      {/* Modern Floating Action Button */}
      {!loading && !error && totalPages > 0 && (
        <View className="absolute bottom-6 right-6">
          {/* Menu Options */}
          {showMenu && (
            <View className="mb-4 items-end">
              <TouchableOpacity
                onPress={goToFirstPage}
                className="bg-red-500  rounded-full p-4 mb-3 shadow-lg"
                style={{ elevation: 8 }}
              >
                <Ionicons name="play-skip-back" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goToLastPage}
                className="bg-red-500 rounded-full p-4 mb-3 shadow-lg"
                style={{ elevation: 8 }}
              >
                <Ionicons name="play-skip-forward" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={openGoToPageModal}
                className="bg-red-500 rounded-full p-4 shadow-lg"
                style={{ elevation: 8 }}
              >
                <Ionicons name="navigate" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* Main FAB */}
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            className="bg-red-500 rounded-full p-5 shadow-xl"
            style={{ elevation: 10 }}
          >
            <Ionicons 
              name={showMenu ? "close" : "menu"} 
              size={28} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Enhanced Go to Page Modal */}
      <Modal
        visible={showGoToPage}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoToPage(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 items-center justify-center">
            <View className="bg-white border-2 border-black rounded-3xl p-8 m-4 w-80 shadow-2xl">
              {/* Header */}
              <View className="items-center mb-6">
                <View className="bg-red-100 rounded-full p-4 mb-4">
                  <Ionicons name="navigate" size={36} color="red" />
                </View>
                <Text className="text-2xl font-bold text-gray-800 text-center">
                  Sayfaya Git
                </Text>
                <Text className="text-gray-600 text-center mt-2">
                  {totalPages} sayfa arasından seçin
                </Text>
              </View>

              {/* Input */}
              <View className="mb-6">
                <Text className="text-gray-700 font-bold mb-3 text-center">Sayfa Numarası</Text>
                <TextInput
                  value={goToPageNumber}
                  onChangeText={setGoToPageNumber}
                  placeholder={`1 - ${totalPages}`}
                  keyboardType="numeric"
                  className="border-2 border-gray-200 rounded-2xl p-4 text-center text-xl font-bold bg-gray-50"
                  style={{ fontSize: 20 }}
                />
                <Text className="text-gray-500 text-sm mt-3 text-center">
                  Mevcut sayfa: <Text className="font-bold text-blue-600">{currentPage}</Text>
                </Text>
              </View>

              {/* Buttons */}
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => {
                    setShowGoToPage(false);
                    setGoToPageNumber('');
                  }}
                  className="flex-1 bg-gray-200 py-4 rounded-2xl"
                >
                  <Text className="text-gray-700 font-bold text-center">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGoToPage}
                  className="flex-1 bg-red-500 py-4 rounded-2xl ml-2"
                  style={{ elevation: 3 }}
                >
                  <Text className="text-white font-bold text-center">Git</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default PDFViewer; 