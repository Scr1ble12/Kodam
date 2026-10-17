import * as Speech from 'expo-speech';

/** Say a Tamil letter aloud with the device's Tamil voice, if it has one. */
export function speakTamil(text: string) {
  Speech.stop();
  Speech.speak(text, { language: 'ta-IN', rate: 0.8 });
}
