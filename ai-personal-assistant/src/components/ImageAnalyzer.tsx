import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ImageAnalysisService from '../services/ImageAnalysisService';

interface ImageAnalyzerProps {
  onAnalysisComplete?: (imageUri: string, analysis: string) => void;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onAnalysisComplete }) => {
  const theme = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const imageAnalysisService = ImageAnalysisService.getInstance();

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('카메라 권한이 필요합니다.');
        return false;
      }
      return true;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: Platform.OS === 'web',
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setImage(imageUri);
        setAnalysis(null);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      alert('이미지를 선택하는데 실패했습니다.');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: Platform.OS === 'web',
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setImage(imageUri);
        setAnalysis(null);
      }
    } catch (error) {
      console.error('카메라 오류:', error);
      alert('사진을 촬영하는데 실패했습니다.');
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setIsLoading(true);
    try {
      const result = await imageAnalysisService.analyzeImage(image);
      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(image, result);
      }
    } catch (error) {
      console.error('이미지 분석 오류:', error);
      alert('이미지를 분석하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={pickImage}
          style={styles.button}
          icon="image"
        >
          갤러리에서 선택
        </Button>
        <Button
          mode="contained"
          onPress={takePhoto}
          style={styles.button}
          icon="camera"
        >
          사진 촬영
        </Button>
      </View>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.error }]}
            onPress={() => {
              setImage(null);
              setAnalysis(null);
            }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {image && !analysis && !isLoading && (
        <Button
          mode="contained"
          onPress={analyzeImage}
          style={styles.analyzeButton}
          icon="magnify"
        >
          이미지 분석하기
        </Button>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>이미지를 분석하고 있습니다...</Text>
        </View>
      )}

      {analysis && (
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>분석 결과</Text>
          <Text style={styles.analysisText}>{analysis}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButton: {
    marginVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  analysisContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default ImageAnalyzer; 