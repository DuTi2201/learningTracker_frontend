"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Bell, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "./ThemeToggle"
import { LanguageToggle } from "./LanguageToggle"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../lib/api"
import { debounce } from "lodash"
import { search } from "../lib/api"
import { useToast } from "@/components/ui/use-toast"
import Link from 'next/link'

interface Notification {
  id: number
  title: string
  message: string
  type: string
  category: string
  related_id: string
  action_url: string
  is_read: boolean
  created_at: string
}

interface SearchResults {
  [key: string]: any[];
}

type Locale = 'en' | 'vi'

export default function Header() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [query, setQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const t = useTranslations()

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setSearchResults(null);
          setIsSearching(false);
          return;
        }

        try {
          const results = await search(query);
          setSearchResults(results);
        } catch (error) {
          console.error('Search failed:', error);
          toast({
            title: t('search.error'),
            description: error instanceof Error ? error.message : String(error),
            variant: "destructive",
          });
        } finally {
          setIsSearching(false);
        }
      }, 300),
    [toast, t]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsSearching(true);
    debouncedSearch(value);
  };

  const handleSearchResultClick = (category: string, id: string | number) => {
    setSearchResults(null)
    const segments = pathname.split('/')
    segments[segments.length - 1] = category
    const newPathname = segments.join('/')
    router.push(`${newPathname}?id=${id}`)
  }

  const handleLanguageChange = (newLocale: Locale) => {
    // Đảm bảo đường dẫn luôn bắt đầu bằng locale mới
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPathname = segments.join('/')
    
    // Sử dụng router.replace thay vì router.push để tránh thêm vào history
    router.replace(newPathname)
  }

  useEffect(() => {
    loadNotifications()
    // Tự động cập nhật thông báo mỗi phút
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Prefetch các route chính
    const prefetchRoutes = ['/materials', '/events', '/assignments', '/goals']
    prefetchRoutes.forEach(route => {
      const prefetchRoute = `/${pathname.split('/')[1]}${route}`
      router.prefetch(prefetchRoute)
    })
  }, [router, pathname])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const data = await getUnreadNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await markNotificationAsRead(notification.id)
      setNotifications(notifications.filter(n => n.id !== notification.id))
      if (notification.action_url) {
        router.push(notification.action_url)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications([])
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return '🗓️'
      case 'assignment':
        return '📝'
      case 'goal':
        return '🎯'
      case 'material':
        return '📚'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'text-destructive'
      case 'warning':
        return 'text-yellow-500'
      case 'success':
        return 'text-green-500'
      default:
        return 'text-primary'
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-200/50 dark:bg-yellow-900/50 rounded px-0.5">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const getMatchScoreText = (score: number) => {
    switch (score) {
      case 4:
        return '★★★★';
      case 3:
        return '★★★';
      case 2:
        return '★★';
      case 1:
        return '★';
      default:
        return '';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder={t('common.search')}
              className="w-full pl-8"
              onChange={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                // Sử dụng setTimeout để cho phép click vào kết quả tìm kiếm trước khi ẩn
                setTimeout(() => {
                  const searchResults = document.querySelector('[data-search-results]');
                  if (searchResults && !searchResults.contains(document.activeElement)) {
                    setIsSearchFocused(false);
                  }
                }, 200);
              }}
            />
            {((isSearching || searchResults) && isSearchFocused) && (
              <div data-search-results className="absolute top-full left-0 w-full mt-2 p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/100 border border-border/40 rounded-md shadow-lg">
                {isSearching ? (
                  <p className="text-sm text-muted-foreground p-2">{t('search.searching')}</p>
                ) : searchResults ? (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {Object.entries(searchResults).map(([category, items]) => {
                      if (!Array.isArray(items) || items.length === 0) return null;
                      return (
                        <div key={category}>
                          <h3 className="font-medium mb-2 text-muted-foreground">{t(`search.${category}`)}</h3>
                          <div className="space-y-1">
                            {items.map((item: any) => (
                              <button
                                key={item.id}
                                className="w-full text-left p-2 hover:bg-accent/40 rounded-md transition-colors duration-200"
                                onClick={() => handleSearchResultClick(category, item.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-sm">
                                      {highlightMatch(item.title, query)}
                                    </div>
                                    {item.description && (
                                      <div className="text-sm text-muted-foreground/90 line-clamp-1">
                                        {highlightMatch(item.description, query)}
                                      </div>
                                    )}
                                  </div>
                                  {item.matchScore && (
                                    <div className="text-xs text-muted-foreground/70 ml-2">
                                      {getMatchScoreText(item.matchScore)}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {Object.values(searchResults).every((items: any[]) => items.length === 0) && (
                      <p className="text-sm text-muted-foreground/70 p-2">{t('search.noResults')}</p>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-[380px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/40"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
                <p className="font-medium">{t('notifications.title')}</p>
                {notifications.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs hover:bg-accent/50">
                    {t('notifications.markAllAsRead')}
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[400px] px-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">
                      {t('notifications.loading')}
                    </p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="grid gap-2 py-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        className={cn(
                          "w-full text-left p-3 rounded-lg",
                          "hover:bg-accent/40 transition-all duration-200",
                          !notification.is_read && "bg-accent/30"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl opacity-90">
                            {getNotificationIcon(notification.category)}
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className={cn(
                              "font-medium text-sm",
                              getNotificationColor(notification.type)
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground/90">
                              {notification.message}
                            </p>
                            <p className="text-[11px] text-muted-foreground/70">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground/70">
                      {t('notifications.noNotifications')}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
    </header>
  )
}

