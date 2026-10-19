/**
 * Plays one recording at the dex's volume. A Game Boy's cry is a harsh thing
 * at full level, and this is the one place that level is set — the Cry button
 * and a sprite set in motion both play through here.
 */
export const playCry = (url: string): void => {
  const audio = new Audio(url);
  audio.volume = 0.3;
  audio.play().catch(() => {
    /* user-gesture missing or autoplay blocked */
  });
};
