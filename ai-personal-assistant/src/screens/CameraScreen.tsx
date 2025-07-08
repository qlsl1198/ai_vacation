import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  List,
  Chip,
  Portal,
  Modal,
  TextInput,
  useTheme,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ImageAnalyzer from '../components/ImageAnalyzer';
import { apiService } from '../services/api';

const { width, height } = Dimensions.get('window');

interface AnalyzedImage {
  id: string;
  uri: string;
  analysis: string;
  timestamp: Date;
  category: 'text' | 'object' | 'face' | 'document';
  confidence: number;
}

export default function CameraScreen() {
  const theme = useTheme();
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<AnalyzedImage | null>(null);
  const [visible, setVisible] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [showImageAnalyzer, setShowImageAnalyzer] = useState(false);

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  const checkApiKeyStatus = async () => {
    await apiService.initialize();
    setIsApiKeySet(apiService.isApiKeySet());
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (!isApiKeySet) {
      Alert.alert(
        'API 키 필요',
        '이미지 분석 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => {
            // 설정 탭으로 이동하는 로직 (추후 구현)
            console.log('설정으로 이동');
          }}
        ]
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }

    setShowImageAnalyzer(true);
  };

  const pickImage = async () => {
    if (!isApiKeySet) {
      Alert.alert(
        'API 키 필요',
        '이미지 분석 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => {
            // 설정 탭으로 이동하는 로직 (추후 구현)
            console.log('설정으로 이동');
          }}
        ]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setShowImageAnalyzer(true);
  };

  const handleAnalysisComplete = (imageUri: string, analysis: string) => {
    // 분석 결과를 카테고리로 분류
    const category = determineCategory(analysis);
    
    const newAnalyzedImage: AnalyzedImage = {
      id: Date.now().toString(),
      uri: imageUri,
      analysis: analysis,
      timestamp: new Date(),
      category,
      confidence: 0.9, // API 응답이므로 높은 신뢰도
    };

    setAnalyzedImages(prev => [newAnalyzedImage, ...prev]);
    setShowImageAnalyzer(false);
    Alert.alert('분석 완료', '이미지 분석이 완료되었습니다.');
  };

  // 분석 결과를 기반으로 카테고리 결정
  const determineCategory = (analysis: string): 'text' | 'object' | 'face' | 'document' => {
    const lowerAnalysis = analysis.toLowerCase();
    
    if (lowerAnalysis.includes('텍스트') || lowerAnalysis.includes('text') || lowerAnalysis.includes('글자')) {
      return 'text';
    } else if (lowerAnalysis.includes('얼굴') || lowerAnalysis.includes('face') || lowerAnalysis.includes('사람')) {
      return 'face';
    } else if (lowerAnalysis.includes('문서') || lowerAnalysis.includes('document') || lowerAnalysis.includes('서류')) {
      return 'document';
    } else {
      return 'object';
    }
  };

  const showImageDetail = (image: AnalyzedImage) => {
    setSelectedImage(image);
    setVisible(true);
  };

  const deleteImage = (id: string) => {
    Alert.alert(
      '이미지 삭제',
      '이 이미지를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setAnalyzedImages(prev => prev.filter(img => img.id !== id));
            if (selectedImage?.id === id) {
              setVisible(false);
              setSelectedImage(null);
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'text': return '#4ECDC4';
      case 'object': return '#45B7D1';
      case 'face': return '#FF6B6B';
      case 'document': return '#96CEB4';
      default: return '#95A5A6';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'text': return 'text';
      case 'object': return 'cube';
      case 'face': return 'person';
      case 'document': return 'file-document';
      default: return 'image';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'text': return '텍스트';
      case 'object': return '객체';
      case 'face': return '얼굴';
      case 'document': return '문서';
      default: return '이미지';
    }
  };

  if (showImageAnalyzer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Button
          mode="text"
          onPress={() => setShowImageAnalyzer(false)}
          icon="arrow-left"
          style={styles.backButton}
          labelStyle={styles.backButtonText}
        >
          뒤로 가기
        </Button>
        <ImageAnalyzer onAnalysisComplete={handleAnalysisComplete} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* 카메라 액션 카드 */}
        <Card style={[styles.cameraCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>이미지 분석</Title>
            <Paragraph style={[styles.cardDescription, { color: theme.colors.onSurfaceVariant }]}>
              {isApiKeySet 
                ? '카메라로 사진을 촬영하거나 갤러리에서 이미지를 선택하여 AI로 분석해보세요.'
                : '이미지 분석 기능을 사용하려면 설정에서 OpenAI API 키를 입력해주세요.'
              }
            </Paragraph>
            <View style={styles.cameraActions}>
              <Button
                mode="contained"
                onPress={takePhoto}
                style={[styles.cameraButton, { backgroundColor: isApiKeySet ? theme.colors.primary : theme.colors.onSurfaceVariant }]}
                icon="camera"
                disabled={!isApiKeySet}
              >
                사진 촬영
              </Button>
              <Button
                mode="outlined"
                onPress={pickImage}
                style={styles.cameraButton}
                icon="image"
                disabled={!isApiKeySet}
              >
                갤러리 선택
              </Button>
            </View>
            {!isApiKeySet && (
              <Paragraph style={[styles.apiKeyNotice, { color: theme.colors.error }]}>
                API 키가 설정되지 않았습니다
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* 분석된 이미지 목록 */}
        <Card style={[styles.imagesCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>분석된 이미지</Title>
            {analyzedImages.length === 0 ? (
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                아직 분석된 이미지가 없습니다. 카메라 버튼을 눌러 첫 이미지를 분석해보세요!
              </Paragraph>
            ) : (
              analyzedImages.map((image) => (
                <Card
                  key={image.id}
                  style={[styles.imageCard, { backgroundColor: theme.colors.surface }]}
                  onPress={() => showImageDetail(image)}
                >
                  <Card.Cover source={{ uri: image.uri }} style={styles.imageCover} />
                  <Card.Content>
                    <View style={styles.imageHeader}>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.categoryChip,
                          { borderColor: getCategoryColor(image.category) }
                        ]}
                        textStyle={{ color: getCategoryColor(image.category) }}
                        icon={getCategoryIcon(image.category)}
                      >
                        {getCategoryName(image.category)}
                      </Chip>
                      <Paragraph style={[styles.confidenceText, { color: theme.colors.onSurfaceVariant }]}>
                        {Math.round(image.confidence * 100)}% 정확도
                      </Paragraph>
                    </View>
                    <Paragraph numberOfLines={2} style={[styles.analysisText, { color: theme.colors.onSurface }]}>
                      {image.analysis}
                    </Paragraph>
                    <Paragraph style={[styles.timestampText, { color: theme.colors.onSurfaceVariant }]}>
                      {image.timestamp.toLocaleString('ko-KR')}
                    </Paragraph>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB for quick camera access */}
      <Portal>
        <FAB
          style={[
            styles.fab,
            { backgroundColor: theme.colors.primary, bottom: Math.min(height * 0.1, 80) + 24, width: 56, height: 56 }
          ]}
          icon="camera"
          onPress={takePhoto}
          disabled={!isApiKeySet}
          size="medium"
        />
      </Portal>

      {/* Image Detail Modal */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => {
            setVisible(false);
            setSelectedImage(null);
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          {selectedImage && (
            <ScrollView>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                {getCategoryName(selectedImage.category)} 분석 결과
              </Title>
              <Paragraph style={[styles.modalAnalysis, { color: theme.colors.onSurface }]}>
                {selectedImage.analysis}
              </Paragraph>
              <View style={styles.modalInfo}>
                <Chip
                  mode="outlined"
                  style={[
                    styles.modalChip,
                    { borderColor: getCategoryColor(selectedImage.category) }
                  ]}
                  textStyle={{ color: getCategoryColor(selectedImage.category) }}
                  icon={getCategoryIcon(selectedImage.category)}
                >
                  {getCategoryName(selectedImage.category)}
                </Chip>
                <Paragraph style={[styles.modalConfidence, { color: theme.colors.onSurfaceVariant }]}>
                  정확도: {Math.round(selectedImage.confidence * 100)}%
                </Paragraph>
              </View>
              <Paragraph style={[styles.modalTimestamp, { color: theme.colors.onSurfaceVariant }]}>
                분석 시간: {selectedImage.timestamp.toLocaleString('ko-KR')}
              </Paragraph>
              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => deleteImage(selectedImage.id)}
                  style={styles.modalButton}
                  textColor={theme.colors.error}
                >
                  삭제
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setVisible(false);
                    setSelectedImage(null);
                  }}
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                >
                  닫기
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: Math.min(width * 0.04, 16),
  },
  backButton: {
    margin: Math.min(width * 0.04, 16),
    minHeight: Math.min(height * 0.05, 40),
  },
  backButtonText: {
    fontSize: Math.min(width * 0.04, 16),
  },
  cameraCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: 'bold',
    marginBottom: Math.min(height * 0.01, 8),
  },
  cardDescription: {
    fontSize: Math.min(width * 0.04, 16),
    lineHeight: Math.min(width * 0.06, 24),
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Math.min(height * 0.02, 16),
  },
  cameraButton: {
    flex: 1,
    marginHorizontal: Math.min(width * 0.02, 8),
    minHeight: Math.min(height * 0.05, 40),
  },
  apiKeyNotice: {
    textAlign: 'center',
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.035, 14),
  },
  imagesCard: {
    marginBottom: Math.min(height * 0.02, 16),
    borderRadius: Math.min(width * 0.03, 12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Math.min(height * 0.02, 16),
    fontSize: Math.min(width * 0.04, 16),
  },
  imageCard: {
    marginBottom: Math.min(height * 0.015, 12),
    borderRadius: Math.min(width * 0.02, 8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageCover: {
    height: Math.min(height * 0.25, 200),
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Math.min(height * 0.01, 8),
  },
  categoryChip: {
    marginRight: Math.min(width * 0.02, 8),
  },
  confidenceText: {
    fontSize: Math.min(width * 0.03, 12),
  },
  analysisText: {
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.035, 14),
    lineHeight: Math.min(width * 0.05, 20),
  },
  timestampText: {
    fontSize: Math.min(width * 0.03, 12),
    marginTop: Math.min(height * 0.005, 4),
  },
  fab: {
    position: 'absolute',
    margin: Math.min(width * 0.04, 16),
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: Math.min(width * 0.05, 20),
    borderRadius: Math.min(width * 0.03, 12),
    maxHeight: '80%',
  },
  modalImage: {
    width: '100%',
    height: Math.min(height * 0.35, 300),
    borderRadius: Math.min(width * 0.02, 8),
  },
  modalTitle: {
    marginTop: Math.min(height * 0.02, 16),
    marginHorizontal: Math.min(width * 0.04, 16),
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: 'bold',
  },
  modalAnalysis: {
    marginHorizontal: Math.min(width * 0.04, 16),
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.04, 16),
    lineHeight: Math.min(width * 0.06, 24),
  },
  modalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Math.min(width * 0.04, 16),
    marginTop: Math.min(height * 0.02, 16),
  },
  modalChip: {
    marginRight: Math.min(width * 0.02, 8),
  },
  modalConfidence: {
    fontSize: Math.min(width * 0.035, 14),
  },
  modalTimestamp: {
    marginHorizontal: Math.min(width * 0.04, 16),
    marginTop: Math.min(height * 0.01, 8),
    fontSize: Math.min(width * 0.03, 12),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Math.min(height * 0.02, 16),
    marginBottom: Math.min(height * 0.02, 16),
    marginHorizontal: Math.min(width * 0.04, 16),
    gap: Math.min(width * 0.02, 8),
  },
  modalButton: {
    flex: 1,
    minHeight: Math.min(height * 0.05, 40),
  },
}); 