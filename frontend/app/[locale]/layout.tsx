import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import Header from "./components/Header"
import Sidebar from "./components/Sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "./components/ThemeProvider"
import { unstable_setRequestLocale } from 'next-intl/server'
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl'
import { locales, Locale } from '@/config/i18n'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Learning Tracker",
  description: "Track your learning progress and goals",
}

async function getMessages(locale: string): Promise<AbstractIntlMessages> {
  try {
    return (await import(`@/i18n/messages/${locale}.json`)).default
  } catch (error) {
    return {}
  }
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  unstable_setRequestLocale(locale)

  if (!locales.includes(locale)) {
    return null // hoặc xử lý lỗi khác
  }

  const messages = await getMessages(locale)

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex h-full bg-background">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8 overflow-y-auto">
                  <div className="max-w-7xl mx-auto">
                    {children}
                  </div>
                </main>
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 