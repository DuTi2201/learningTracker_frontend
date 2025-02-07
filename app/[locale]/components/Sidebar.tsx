"use client"

import Link from "next/link"
import Image from "next/image"
import { Home, Target, Calendar, Book, FileText } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { useTheme } from "next-themes"

export default function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations()
  const { theme } = useTheme()

  const navItems = [
    { icon: Home, label: t('nav.dashboard'), href: "/" },
    { icon: Target, label: t('nav.goals'), href: "/goals" },
    { icon: Calendar, label: t('nav.events'), href: "/events" },
    { icon: Book, label: t('nav.materials'), href: "/materials" },
    { icon: FileText, label: t('nav.assignments'), href: "/assignments" },
  ]

  return (
    <aside className="bg-sidebar-background text-sidebar-foreground w-64 min-h-screen border-r border-sidebar-border flex flex-col">
      {/* Logo container */}
      <div className="pl-5 pt-5">
        <div className="relative w-[223px] h-[105px]">
          <Image
            src={theme === 'dark' ? '/dark_logo.svg' : '/light_logo.svg'}
            alt="Learning Tracker Logo"
            fill
            sizes="223px"
            priority
            className="object-contain transition-opacity duration-300 hover:opacity-90"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 space-y-2.5">
        {navItems.map((item) => {
          const isActive = pathname.endsWith(item.href)
          const fullPath = pathname.split('/').slice(0, 2).join('/') + item.href
          return (
            <Link
              key={item.href}
              href={fullPath}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:translate-x-1",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-4 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

