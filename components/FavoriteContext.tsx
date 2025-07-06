import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface PDFFile {
  id: string;
  name: string;
  uri: string;
  size: number;
  lastModified: Date;
}

interface FavoriteContextType {
  favoritePDFs: PDFFile[];
  addToFavorites: (pdf: PDFFile) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  loadFavorites: () => Promise<void>;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoriteProvider');
  }
  return context;
};

export const FavoriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoritePDFs, setFavoritePDFs] = useState<PDFFile[]>([]);

  const FAVORITES_KEY = '@gpdf_favorites';

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        // Convert date strings back to Date objects
        const favoritesWithDates = parsedFavorites.map((pdf: any) => ({
          ...pdf,
          lastModified: new Date(pdf.lastModified)
        }));
        setFavoritePDFs(favoritesWithDates);
      }
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
    }
  };

  const saveFavorites = async (favorites: PDFFile[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Favoriler kaydedilirken hata:', error);
    }
  };

  const addToFavorites = async (pdf: PDFFile) => {
    try {
      const isAlreadyFavorite = favoritePDFs.some(fav => fav.id === pdf.id);
      if (isAlreadyFavorite) {
        Alert.alert('Bilgi', 'Bu PDF zaten favorilerinizde!');
        return;
      }

      const updatedFavorites = [...favoritePDFs, pdf];
      setFavoritePDFs(updatedFavorites);
      await saveFavorites(updatedFavorites);
      Alert.alert('Başarılı', 'PDF favorilere eklendi!');
    } catch (error) {
      console.error('Favorilere ekleme hatası:', error);
      Alert.alert('Hata', 'PDF favorilere eklenirken bir hata oluştu.');
    }
  };

  const removeFromFavorites = async (id: string) => {
    try {
      const updatedFavorites = favoritePDFs.filter(fav => fav.id !== id);
      setFavoritePDFs(updatedFavorites);
      await saveFavorites(updatedFavorites);
      Alert.alert('Başarılı', 'PDF favorilerden kaldırıldı!');
    } catch (error) {
      console.error('Favorilerden kaldırma hatası:', error);
      Alert.alert('Hata', 'PDF favorilerden kaldırılırken bir hata oluştu.');
    }
  };

  const isFavorite = (id: string): boolean => {
    return favoritePDFs.some(fav => fav.id === id);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <FavoriteContext.Provider value={{
      favoritePDFs,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      loadFavorites
    }}>
      {children}
    </FavoriteContext.Provider>
  );
}; 