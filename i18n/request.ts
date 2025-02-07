import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/config/i18n';

export default getRequestConfig(async ({ locale }) => {
  // Kiểm tra locale có hợp lệ không
  if (!locales.includes(locale as Locale)) {
    return {
      messages: {},
      timeZone: 'Asia/Ho_Chi_Minh'
    };
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Asia/Ho_Chi_Minh'
  };
}); 