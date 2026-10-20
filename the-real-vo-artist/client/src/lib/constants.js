export const FONTS = {
  inter: { label: 'Inter — clean', css: "'Inter', sans-serif" },
  playfair: { label: 'Playfair — elegant', css: "'Playfair Display', serif" },
  'space-grotesk': { label: 'Space Grotesk — modern', css: "'Space Grotesk', sans-serif" },
  poppins: { label: 'Poppins — friendly', css: "'Poppins', sans-serif" },
};

export const SECTION_LABELS = {
  about: 'About / Bio',
  samples: 'Voice Samples',
  details: 'Details (languages, style, price)',
};

export const DEFAULT_LAYOUT = {
  themeColor: '#7c3aed',
  font: 'inter',
  sectionOrder: ['about', 'samples', 'details'],
};

export const THEME_PRESETS = ['#7c3aed', '#db2777', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export const VOICE_STYLES = [
  'Narration', 'Commercial', 'Animation', 'Character', 'Audiobook', 'E-learning',
  'Documentary', 'Corporate', 'Trailer', 'IVR / Phone', 'Gaming', 'Podcast',
];

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

export const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP'];

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_MB = 5;

export const AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave',
  'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/ogg',
];
export const AUDIO_EXT_RE = /\.(mp3|wav|m4a|aac|ogg)$/i;
export const MAX_AUDIO_MB = 15;

export const DOC_EXT_RE = /\.(pdf|doc|docx|txt)$/i;
export const MAX_DOC_MB = 10;

export function formatPrice(amount, currency = 'USD') {
  if (amount == null) return 'On request';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
