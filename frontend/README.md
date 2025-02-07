# 📚 Learning Tracker

> Ứng dụng theo dõi quá trình học tập hiện đại với giao diện đẹp mắt, hỗ trợ đa ngôn ngữ và nhiều tính năng hữu ích cho việc quản lý học tập.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

![Demo Screenshot](public/placeholder.svg)

## 🌟 Tổng quan

Learning Tracker là một ứng dụng web hiện đại giúp người dùng theo dõi và quản lý quá trình học tập của mình một cách hiệu quả. Với giao diện người dùng trực quan và các tính năng đa dạng, ứng dụng hỗ trợ việc:
- Theo dõi tiến độ học tập qua biểu đồ
- Quản lý mục tiêu và kế hoạch học tập
- Lập lịch học và sự kiện
- Tổ chức tài liệu học tập
- Quản lý bài tập và deadline

## 🚀 Tính năng

- 📊 Dashboard theo dõi tiến độ học tập
- 🎯 Quản lý mục tiêu học tập
- 📅 Lịch học và sự kiện
- 📚 Quản lý tài liệu học tập
- ✍️ Quản lý bài tập
- 🌐 Hỗ trợ đa ngôn ngữ (Tiếng Việt, Tiếng Anh)
- 🌓 Giao diện sáng/tối

## 🛠️ Công nghệ sử dụng

- [Next.js 14](https://nextjs.org/) - Framework React với Server Components
- [TypeScript](https://www.typescriptlang.org/) - JavaScript với kiểu dữ liệu tĩnh
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS tiện ích
- [Shadcn/ui](https://ui.shadcn.com/) - Thư viện components có thể tái sử dụng
- [Next-intl](https://next-intl-docs.vercel.app/) - Giải pháp đa ngôn ngữ
- [Next-themes](https://github.com/pacocoursey/next-themes) - Quản lý theme sáng/tối
- [Recharts](https://recharts.org/) - Thư viện biểu đồ
- [React Hook Form](https://react-hook-form.com/) - Quản lý form
- [Zod](https://zod.dev/) - Kiểm tra và xác thực dữ liệu

## 🚦 Bắt đầu

1. **Clone dự án**
```bash
git clone <repository-url>
cd frontend
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Chạy môi trường development**
```bash
npm run dev
```

4. **Build và chạy production**
```bash
npm run build
npm start
```

## 📁 Cấu trúc thư mục

```
frontend/
├── app/                    # App router và components
│   ├── [locale]/          # Route theo ngôn ngữ
│   │   ├── components/    # Shared components
│   │   ├── (routes)/     # Route groups
│   │   └── layout.tsx    # Root layout
│   └── globals.css       # Global styles
├── components/            # UI components
├── config/               # Cấu hình ứng dụng
├── i18n/                 # Đa ngôn ngữ
│   └── messages/        # Các file ngôn ngữ
├── lib/                  # Utilities và helpers
└── public/              # Static assets
```

## 🌍 Đa ngôn ngữ

Ứng dụng hỗ trợ hai ngôn ngữ:
- 🇻🇳 Tiếng Việt (Mặc định)
- 🇬🇧 Tiếng Anh

File ngôn ngữ được đặt trong thư mục `i18n/messages/`.

## 🎨 Theming

Ứng dụng sử dụng CSS variables và Tailwind CSS để quản lý theme. Có ba chế độ:
- 🌞 Light
- 🌚 Dark
- 💻 System (Theo cài đặt hệ thống)

## 📝 Quy ước đặt tên

- **Components:** PascalCase (VD: `Sidebar.tsx`)
- **Utilities:** camelCase (VD: `formatDate.ts`)
- **Constants:** SCREAMING_SNAKE_CASE (VD: `DEFAULT_LOCALE`)
- **CSS Classes:** kebab-case (VD: `hover-scale`)

## 🤝 Đóng góp

1. Fork dự án
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'Add amazing feature'`)
4. Push lên branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.
