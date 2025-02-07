# Learning Tracker

Ứng dụng theo dõi quá trình học tập với giao diện hiện đại và đa ngôn ngữ.

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
