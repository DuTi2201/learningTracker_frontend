const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cấu hình next.js của bạn ở đây
}

module.exports = withNextIntl(nextConfig); 