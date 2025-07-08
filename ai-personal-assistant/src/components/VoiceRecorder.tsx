import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import VoiceService from '../services/VoiceService';

interface VoiceRecorderProps {
  onResult: (text: string) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onResult }) => {
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const voiceService = VoiceService.getInstance();

  useEffect(() => {
    return () => {
      voiceService.destroy();
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      await voiceService.startListening(
        (results) => {
          setResults(results);
          if (results.length > 0) {
            onResult(results[0]);
          }
        },
        (error) => {
          console.error('음성 인식 오류:', error);
          setIsRecording(false);
        }
      );
      setIsRecording(true);
    } catch (error) {
      console.error('음성 인식 시작 오류:', error);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      await voiceService.stopListening();
      setIsRecording(false);
    } catch (error) {
      console.error('음성 인식 중지 오류:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.recording,
          { backgroundColor: isRecording ? theme.colors.error : theme.colors.primary }
        ]}
        onPress={isRecording ? handleStopRecording : handleStartRecording}
      >
        {isRecording ? (
          <ActivityIndicator color="white" />
        ) : (
          <Ionicons name="mic" size={24} color="white" />
        )}
      </TouchableOpacity>
      <Text style={styles.text}>
        {isRecording ? '음성 인식 중...' : '마이크를 눌러 음성 인식 시작'}
      </Text>
      {results.length > 0 && (
        <Text style={styles.result}>{results[0]}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recording: {
    transform: [{ scale: 1.1 }],
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  result: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default VoiceRecorder; 