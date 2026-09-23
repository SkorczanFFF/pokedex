import type { DexEra } from "@/domain/era";
import configUrl from "mespeak/src/mespeak_config.json?url";
import enUrl from "mespeak/voices/en/en-us.json?url";
import plUrl from "mespeak/voices/pl.json?url";

type MeSpeak = typeof import("mespeak").default;

// eSpeak's own voice already sounds like a machine; the era only sets how far it is pushed.
const STYLES = {
  clean: { pitch: 60, speed: 165, rate: 0, bits: 0 },
  "8-bit": { pitch: 50, speed: 150, rate: 8000, bits: 5 },
} satisfies Record<DexEra["voice"], unknown>;

const VOICES: Record<string, string> = { pl: "pl", en: "en/en-us" };

// ~1 MB gzipped, so it is fetched on the first read rather than with the page.
let engine: Promise<MeSpeak> | null = null;
const loadEngine = () =>
  (engine ??= (async () => {
    const json = (url: string) => fetch(url).then((r) => r.json());
    const [{ default: meSpeak }, config, en, pl] = await Promise.all([
      import("mespeak"),
      json(configUrl),
      json(enUrl),
      json(plUrl),
    ]);
    meSpeak.loadConfig(config);
    // English first: the Polish voice switches to its dictionary for foreign words.
    meSpeak.loadVoice(en);
    meSpeak.loadVoice(pl);
    return meSpeak;
  })().catch((error) => {
    engine = null;
    throw error;
  }));

// The engine keeps only the low byte of each char, so it is handed the UTF-8 bytes instead.
const utf8 = (text: string) =>
  String.fromCharCode(...new TextEncoder().encode(text));

// Sample-and-hold plus quantising: the Game Boy's coarse speaker.
const crush = (buffer: AudioBuffer, rate: number, bits: number) => {
  const hold = Math.max(1, Math.round(buffer.sampleRate / rate));
  const levels = 2 ** (bits - 1);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.round(data[i - (i % hold)] * levels) / levels;
  }
};

// A small speaker's band, then a short comb for the metallic ring.
const speaker = (ctx: AudioContext) => {
  const lowCut = new BiquadFilterNode(ctx, { type: "highpass", frequency: 300 });
  const highCut = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 3400 });
  const comb = new DelayNode(ctx, { delayTime: 0.007 });
  const feedback = new GainNode(ctx, { gain: 0.5 });
  const out = new GainNode(ctx, { gain: 0.5 });

  lowCut.connect(highCut).connect(out);
  highCut.connect(comb).connect(out);
  comb.connect(feedback).connect(comb);
  out.connect(ctx.destination);

  return { input: lowCut, release: () => out.disconnect() };
};

let ctx: AudioContext | null = null;
let active: (() => void) | null = null;

/** Stops whatever the dex is saying, or is about to say. */
export const hush = () => active?.();

/**
 * Reads `text` in the dex's voice. Resolves when it has been said or hushed,
 * and calls `onStart` once the sound begins, after the engine has loaded.
 */
export const say = (
  text: string,
  lang: string,
  style: DexEra["voice"],
  onStart: () => void
) => {
  hush();
  // Made inside the click, where Safari still allows a context to start.
  ctx ??= new AudioContext();
  void ctx.resume();
  const audio = ctx;

  return new Promise<void>((resolve, reject) => {
    let source: AudioBufferSourceNode | null = null;
    const stop = () => {
      if (active === stop) active = null;
      source?.stop();
      resolve();
    };
    active = stop;

    const play = async () => {
      const meSpeak = await loadEngine();
      if (active !== stop) return;
      const { pitch, speed, rate, bits } = STYLES[style];
      const wav = meSpeak.speak(utf8(text), {
        voice: VOICES[lang] ?? VOICES.en,
        pitch,
        speed,
        rawdata: "arraybuffer",
      });
      if (!wav) throw new Error("meSpeak returned no audio");

      const buffer = await audio.decodeAudioData(wav);
      if (active !== stop) return;
      if (rate) crush(buffer, rate, bits);

      const out = speaker(audio);
      source = new AudioBufferSourceNode(audio, { buffer });
      source.connect(out.input);
      source.onended = () => {
        out.release();
        stop();
      };
      source.start();
      onStart();
    };

    play().catch((error) => {
      if (active === stop) active = null;
      reject(error);
    });
  });
};
