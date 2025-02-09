import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/settings';

// Middleware cho next-intl
export default createMiddleware({
  // Danh sách các ngôn ngữ được hỗ trợ
  locales,
  
  // Ngôn ngữ mặc định
  defaultLocale,

  // Chuyển hướng nếu không có locale trong URL
  localePrefix: 'always'
});

// Cấu hình matcher cho middleware
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}; 