export const locales = ['en', 'vi'] as const;
export const defaultLocale = 'vi' as const;

export type Locale = (typeof locales)[number]; 