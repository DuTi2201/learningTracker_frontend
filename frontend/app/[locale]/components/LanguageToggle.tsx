"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'

export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()

  const handleLanguageChange = (newLocale: 'en' | 'vi') => {
    // Đảm bảo đường dẫn luôn bắt đầu bằng locale mới
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPathname = segments.join('/')
    
    // Sử dụng router.replace thay vì router.push để tránh thêm vào history
    router.replace(newPathname)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('common.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange('vi')}>
          🇻🇳 Tiếng Việt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
 