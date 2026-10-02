export const PRINT_PROFILES = {
  digital: { key: 'digital', minDpi: 0, separateCover: false },
  kdp: { key: 'kdp', minDpi: 300, bleedIn: 0.125, minPages: 24, separateCover: true }
};
export function physicalPages(count, bookMode, profile = 'digital', backCover = true) {
  if (!Number.isInteger(count) || count < 1) throw Error('Număr de scene invalid.');
  if (profile !== 'kdp') return [0, ...Array.from({ length: count }, (_, i) => i + 1), ...(backCover ? ['back'] : [])].map(pg => ({ pg, mode: bookMode }));
  if (bookMode === 'combined') return [{pg:'title',mode:'color'},{pg:'copyright',mode:'color'},...Array.from({length:count},(_,i)=>({pg:i+1,mode:'color'})),...Array.from({length:count},(_,i)=>({pg:i+1,mode:'lineart'}))];
  if (bookMode === 'lineart') return [{ pg: 'title', mode: bookMode }, { pg: 'copyright', mode: bookMode }, ...Array.from({ length: count }, (_, i) => [{ pg: i + 1, mode: bookMode }, { pg: 'blank', mode: bookMode }]).flat()];
  return [{ pg: 'title', mode: bookMode }, { pg: 'copyright', mode: bookMode }, { pg: 'characters', mode: bookMode }, ...Array.from({ length: count }, (_, i) => [{ pg: i + 1, mode: bookMode, illustrationOnly: true }, { pg: i + 1, mode: bookMode, textOnly: true }]).flat(), { pg: 'reflection', mode: bookMode }];
}
export function printDimensions(format, profile) {
  if (!(format?.trim_w_in > 0 && format?.trim_h_in > 0)) throw Error('Format invalid.');
  const p = PRINT_PROFILES[profile] || PRINT_PROFILES.digital;
  return { width: format.trim_w_in + (p.bleedIn || 0), height: format.trim_h_in + 2 * (p.bleedIn || 0), minDpi: p.minDpi, profile: p.key };
}
