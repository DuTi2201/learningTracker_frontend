"use client"

import { useState } from "react"
import { ModeToggle } from "./ModeToggle"
import { Notifications } from "./Notifications"
import { Search, Globe2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { locales, type Locale } from '@/config/i18n'

export default function Header() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale() as Locale
  const t = useTranslations()

  const handleLanguageChange = (newLocale: Locale) => {
    // Đảm bảo đường dẫn luôn bắt đầu bằng locale mới
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPathname = segments.join('/')
    
    // Sử dụng router.replace thay vì router.push để tránh thêm vào history
    router.replace(newPathname)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-navbar-border bg-navbar-background/95 backdrop-blur supports-[backdrop-filter]:bg-navbar-background/60">
      <div className="container flex h-14 items-center">
        {/* Thanh tìm kiếm */}
        <div className="flex items-center relative ml-4 max-w-md w-full">
          <Search className={`absolute left-3 h-4 w-4 transition-colors ${
            isSearchFocused ? "text-primary" : "text-muted-foreground"
          }`} />
          <Input
            type="search"
            placeholder={t('common.search')}
            className="pl-9 pr-4 py-2 h-9 bg-background/50 w-full focus:ring-2 focus:ring-primary/20"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>

        <div className="flex-1" />

        {/* Các nút bên phải */}
        <div className="flex items-center gap-2 mr-4">
          <Notifications />
          <ModeToggle />
          
          {/* Nút chuyển đổi ngôn ngữ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe2 className="h-5 w-5" />
                <span className="sr-only">{t('common.language')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleLanguageChange('vi')}
                className={locale === 'vi' ? "bg-accent" : ""}
              >
                Tiếng Việt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLanguageChange('en')}
                className={locale === 'en' ? "bg-accent" : ""}
              >
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

