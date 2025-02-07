import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './config/i18n';

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
  matcher: [
    // Chặn tất cả các đường dẫn (public + protected)
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Chặn các đường dẫn có locale
    '/(vi|en)/:path*'
  ]
}; 