// Vite copies each paper into the build with a content hash and gives back its URL.
const files = import.meta.glob<string>('/content/papers/*.pdf', { query: '?url', import: 'default', eager: true });

/** The served URL of a file in content/papers/. */
export function paperUrl(file: string): string {
  const url = files[`/content/papers/${file}`];
  if (!url) throw new Error(`content/papers/${file} does not exist`);
  return url;
}
