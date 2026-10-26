import type { DexEra } from "@/domain/era";
import { speakable } from "@/domain/text";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/locale";
import configUrl from "mespeak/src/mespeak_config.json?url";
import enUrl from "mespeak/voices/en/en-us.json?url";
import plUrl from "mespeak/voices/pl.json?url";

type MeSpeak = typeof import("mespeak").default;

// eSpeak's own voice already sounds like a machine; the era only sets how far it is pushed.
// `variant` is an eSpeak voice variant (m1–m7, f1–f5, klatt…); `ring` the comb's feedback.
const STYLES = {
  clean: { variant: "m3", pitch: 50, speed: 155, ring: 0, rate: 0, bits: 0 },
  "8-bit": { variant: undefined, pitch: 50, speed: 150, ring: 0.5, rate: 8000, bits: 5 },
} satisfies Record<DexEra["voice"], unknown>;

/** meSpeak's voice file for each language the UI reads in. */
const VOICES: Record<Locale, string> = { pl: "pl", en: "en/en-us" };

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
const speaker = (ctx: AudioContext, ring: number) => {
  const lowCut = new BiquadFilterNode(ctx, { type: "highpass", frequency: 300 });
  const highCut = new BiquadFilterNode(ctx, { type: "lowpass", frequency: 3400 });
  const out = new GainNode(ctx, { gain: ring ? 0.5 : 1 });

  lowCut.connect(highCut).connect(out);
  if (ring) {
    const comb = new DelayNode(ctx, { delayTime: 0.007 });
    const feedback = new GainNode(ctx, { gain: ring });
    highCut.connect(comb).connect(out);
    comb.connect(feedback).connect(comb);
  }
  out.connect(ctx.destination);

  return { input: lowCut, release: () => out.disconnect() };
};

/** Languages eSpeak reads too badly: the device's own voice takes them when it has one. */
const DEVICE_LANGUAGES: readonly Locale[] = ["pl", "en"];

// Chrome fills the list only after `voiceschanged`; a device with no voices never fires it.
const deviceVoices = () =>
  new Promise<SpeechSynthesisVoice[]>((resolve) => {
    if (!("speechSynthesis" in window)) return resolve([]);
    const now = speechSynthesis.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1000);
  });

// Neural voices first (Edge's "Online (Natural)"), then Google's, then whatever there is.
const RANK = [/natural|online/i, /google/i, /./];
const deviceVoice = async (locale: Locale) => {
  const voices = (await deviceVoices()).filter((v) =>
    v.lang.toLowerCase().startsWith(locale)
  );
  return RANK.map((name) => voices.find((v) => name.test(v.name))).find(Boolean);
};

// One utterance per sentence: Chrome's Google voices fall silent ~15 s into a long one.
const speakOnDevice = (
  text: string,
  voice: SpeechSynthesisVoice,
  onStart: () => void,
  onEnd: () => void
) => {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  sentences.forEach((sentence, i) => {
    const utterance = new SpeechSynthesisUtterance(sentence.trim());
    utterance.voice = voice;
    utterance.lang = voice.lang;
    if (i === 0) utterance.onstart = onStart;
    if (i === sentences.length - 1) utterance.onend = utterance.onerror = onEnd;
    speechSynthesis.speak(utterance);
  });
  return () => speechSynthesis.cancel();
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

  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  return new Promise<void>((resolve, reject) => {
    let halt = () => {};
    let stopped = false;
    // Once only: a cancelled device voice reports back later, by when another read may be on.
    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (active === stop) active = null;
      halt();
      resolve();
    };
    active = stop;

    const play = async () => {
      const device = DEVICE_LANGUAGES.includes(locale) && (await deviceVoice(locale));
      if (active !== stop) return;
      if (device) {
        halt = speakOnDevice(speakable(text), device, onStart, stop);
        return;
      }

      const meSpeak = await loadEngine();
      if (active !== stop) return;
      const { variant, pitch, speed, ring, rate, bits } = STYLES[style];
      const wav = meSpeak.speak(utf8(speakable(text)), {
        voice: VOICES[locale],
        variant,
        pitch,
        speed,
        rawdata: "arraybuffer",
      });
      if (!wav) throw new Error("meSpeak returned no audio");

      const buffer = await audio.decodeAudioData(wav);
      if (active !== stop) return;
      if (rate) crush(buffer, rate, bits);

      const out = speaker(audio, ring);
      const source = new AudioBufferSourceNode(audio, { buffer });
      halt = () => source.stop();
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
