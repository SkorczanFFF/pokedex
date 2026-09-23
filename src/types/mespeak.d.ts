// Only what the dex's voice uses; the package ships no types.
declare module "mespeak" {
  interface SpeakOptions {
    voice?: string;
    pitch?: number;
    speed?: number;
    rawdata?: "arraybuffer";
  }

  const meSpeak: {
    loadConfig(data: object): void;
    loadVoice(data: object): void;
    speak(text: string, options: SpeakOptions): ArrayBuffer | null;
  };
  export default meSpeak;
}
