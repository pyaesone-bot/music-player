export const colors = {
  bg: '#0E0B1E',
  bgElevated: '#1A1530',
  card: '#211B3A',
  cardAlt: '#2A2350',
  primary: '#8B5CF6',
  primaryDark: '#6D28D9',
  accent: '#EC4899',
  text: '#F5F3FF',
  textMuted: '#A79FC7',
  textFaint: '#6B6390',
  border: '#2E2750',
  danger: '#F43F5E',
  overlay: 'rgba(0,0,0,0.55)',
};

export const gradients = {
  header: ['#8B5CF6', '#EC4899'] as const,
  player: ['#3B2A6B', '#0E0B1E'] as const,
  art: ['#6D28D9', '#EC4899'] as const,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const spacing = (n: number) => n * 4;
