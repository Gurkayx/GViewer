import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Row, Rows, Table } from 'react-native-table-component';
import XLSX from 'xlsx';

export default function ExcelViewer() {
  const { uri, name } = useLocalSearchParams<{ uri: string; name: string }>();
  const router = useRouter();
  const [tableHead, setTableHead] = useState<string[]>([]);
  const [tableData, setTableData] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleRows, setVisibleRows] = useState(100);
  const [orientation, setOrientation] = useState<OrientationType | undefined>(undefined);

  useEffect(() => {
    Orientation.lockToLandscape();
    Orientation.addOrientationListener(handleOrientationChange);
    return () => {
      Orientation.lockToPortrait();
      Orientation.removeOrientationListener(handleOrientationChange);
    };
  }, []);

  const handleOrientationChange = (o: OrientationType) => {
    setOrientation(o);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Orientation.lockToPortrait();
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        subscription.remove();
      };
    }, [])
  );

  useEffect(() => {
    if (uri) {
      loadExcel(uri as string);
    }
  }, [uri]);

  const handleBack = () => {
    Orientation.lockToPortrait();
    router.back();
  };

  const loadExcel = async (fileUri: string) => {
    try {
      setLoading(true);
      setError(null);
      setVisibleRows(100);
      let readUri = fileUri;
      console.log('Excel dosyası yükleniyor:', fileUri);
      if (fileUri.startsWith('content://')) {
        const destPath = FileSystem.cacheDirectory + 'temp_excel.xlsx';
        console.log('Dosya content:// ile başlıyor, cache dizinine kopyalanıyor:', destPath);
        await FileSystem.copyAsync({ from: fileUri, to: destPath });
        readUri = destPath;
      }
      const b64 = await FileSystem.readAsStringAsync(readUri, { encoding: FileSystem.EncodingType.Base64 });
      console.log('Dosya base64 okundu, uzunluk:', b64.length);
      const wb = XLSX.read(b64, { type: 'base64' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log('Sheet parse edildi, satır sayısı:', data.length);
      if (data.length > 0) {
        setTableHead(data[0].map((cell: any) => String(cell)));
        setTableData(data.slice(1).map(row => row.map(cell => String(cell ?? ''))));
      } else {
        setTableHead([]);
        setTableData([]);
      }
    } catch (err: any) {
      console.error('Excel dosyası okunamadı:', err);
      setError('Excel dosyası okunamadı veya bozuk.\n' + (err?.message || err?.toString()));
      Alert.alert('Hata', 'Excel dosyası okunamadı veya bozuk.\n' + (err?.message || err?.toString()));
    } finally {
      setLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const colWidth = tableHead.length > 0 ? Math.max(100, Math.floor(screenWidth / tableHead.length)) : 120;
  const widthArr = tableHead.map(() => colWidth);

  const isLandscape =
    orientation === undefined ||
    orientation === 'LANDSCAPE-LEFT' ||
    orientation === 'LANDSCAPE-RIGHT';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0fdf4', padding: 0 }}>
      {/* Header */}
      <View style={{ backgroundColor: '#22c55e', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, marginBottom: 12 }}>
        <TouchableOpacity onPress={handleBack} style={{ marginRight: 16, padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={{ backgroundColor: '#bbf7d0', borderRadius: 16, padding: 8, marginRight: 16 }}>
          <Ionicons name="logo-microsoft" size={28} color="#22c55e" />
        </View>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, flex: 1 }} numberOfLines={1}>
          {name || 'Excel Dosyası'}
        </Text>
      </View>
      {/* Tablo ve içerik */}
      {loading ? (
        <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</Text>
      ) : tableHead.length === 0 ? (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Tablo verisi bulunamadı.</Text>
      ) : (
        <ScrollView style={{ flexGrow: 1 }}>
          <ScrollView horizontal style={{ flexGrow: 1 }}>
            <View style={{ minWidth: 350, minHeight: 300, alignSelf: 'center' }}>
              <Table borderStyle={{ borderWidth: 1, borderColor: '#16a34a' }}>
                <Row data={tableHead} widthArr={widthArr} style={{ height: 40, backgroundColor: '#bbf7d0' }} textStyle={{ textAlign: 'center', fontWeight: 'bold', color: '#166534' }} />
                <Rows data={tableData.slice(0, visibleRows)} widthArr={widthArr} textStyle={{ textAlign: 'center', color: '#166534' }} />
              </Table>
              {tableData.length > visibleRows && (
                <TouchableOpacity
                  onPress={() => setVisibleRows(visibleRows + 100)}
                  style={{ marginTop: 12, alignSelf: 'center', backgroundColor: '#22c55e', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 16 }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Devamını Göster</Text>
                </TouchableOpacity>
              )}
              {tableData.length > 100 && (
                <Text style={{ color: '#16a34a', marginTop: 8, textAlign: 'center' }}>
                  {`Toplam ${tableData.length} satır, şu an ${Math.min(visibleRows, tableData.length)} satır gösteriliyor.`}
                </Text>
              )}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
} 