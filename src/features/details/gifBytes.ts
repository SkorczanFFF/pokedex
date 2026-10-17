const fetched = new Map<string, Promise<ArrayBuffer>>();

/**
 * A GIF's bytes, fetched once. The sprite's bounds read them for how far the
 * frames reach, and the playback for how long a pass runs — and the playback
 * is a click away from the bounds, so by then they are in hand. A fetch that
 * failed is forgotten, so the next ask can try again.
 */
export const gifBytes = (url: string): Promise<ArrayBuffer> => {
  const cached = fetched.get(url);
  if (cached) return cached;
  const fetching = fetch(url).then((response) => {
    if (!response.ok) throw new Error(response.statusText);
    return response.arrayBuffer();
  });
  fetching.catch(() => fetched.delete(url));
  fetched.set(url, fetching);
  return fetching;
};
