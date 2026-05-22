import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

/**
 * AudioService — Premium health application soundscapes.
 * Provides immersion during scans and interaction feedback.
 */
class AudioServiceClass {
  private scanSound: AudioPlayer | null = null;
  private uiSound: AudioPlayer | null = null;

  // Stable royalty-free assets for demo (can be replaced by local assets)
  private ASSETS = {
    heartbeat: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_f55f606342.mp3', // Rhythmic heartbeat
    breath: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_82c237a303.mp3', // Soft breathing
    success: 'https://www.soundjay.com/buttons/button-2.mp3', // Success chime
    error: 'https://www.soundjay.com/buttons/button-10.mp3', // Error/caution beep
    pair: 'https://www.soundjay.com/buttons/button-3.mp3', // Pairing success
  };

  /** Initialize binary settings */
  async init() {
    if (Platform.OS === 'web') return;
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
      });
    } catch (e) {
      console.warn('Audio initialization failed', e);
    }
  }

  /** Start playing the scan audio in a loop */
  async startScanAudio(type: string) {
    if (Platform.OS === 'web') return;
    try {
      // Stop any existing scan audio
      await this.stopScanAudio();

      const source = type.toLowerCase().includes('heart') ? this.ASSETS.heartbeat : this.ASSETS.breath;
      
      const player = createAudioPlayer({ uri: source });
      player.loop = true;
      player.volume = 0.4;
      this.scanSound = player;
      
      player.play();
    } catch (e) {
      console.warn('Failed to start scan audio', e);
    }
  }

  /** Stop the current scan audio and unload it */
  async stopScanAudio() {
    if (Platform.OS === 'web') return;
    try {
      if (this.scanSound) {
        this.scanSound.pause();
        (this.scanSound as any).remove();
        this.scanSound = null;
      }
    } catch (e) {
      // Silently fail
    }
  }

  /** Play a short UI feedback sound */
  async playFeedback(key: 'success' | 'error' | 'pair') {
    if (Platform.OS === 'web') return;
    try {
      if (this.uiSound) {
        this.uiSound.pause();
        (this.uiSound as any).remove();
        this.uiSound = null;
      }
      
      const player = createAudioPlayer({ uri: this.ASSETS[key] });
      this.uiSound = player;
      
      // Auto-release player after finishing
      const subscription = (player as any).addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish) {
          subscription.remove();
          if (this.uiSound === player) {
            (player as any).remove();
            this.uiSound = null;
          } else {
            (player as any).remove();
          }
        }
      });

      player.play();
    } catch (e) {
      // Silently fail
    }
  }
}

export const AudioService = new AudioServiceClass();

