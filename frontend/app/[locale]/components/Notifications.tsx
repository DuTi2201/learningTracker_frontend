"use client"

import { useState } from "react"
import { Bell, FileText, Calendar, Book, Info, Check, Loader2 } from "lucide-react"
import { useTranslations } from 'next-intl'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

interface Notification {
  id: string
  title: string
  message: string
  time: Date
  read: boolean
  type: "assignment" | "event" | "material" | "system"
}

// Mock data cho thông báo
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Bài tập mới",
    message: "Bạn có bài tập TOEIC Practice Test 1 cần hoàn thành",
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 phút trước
    read: false,
    type: "assignment",
  },
  {
    id: "2",
    title: "Sự kiện sắp diễn ra",
    message: "Buổi học Day 1 - Review sẽ bắt đầu trong 1 giờ nữa",
    time: new Date(Date.now() - 1000 * 60 * 60), // 1 giờ trước
    read: false,
    type: "event",
  },
  {
    id: "3",
    title: "Tài liệu mới",
    message: "Tài liệu Study Guide - M08W1 đã được thêm vào thư viện",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 giờ trước
    read: true,
    type: "material",
  },
]

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations()

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setIsLoading(true)
    // Giả lập API call
    setTimeout(() => {
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      )
      setIsLoading(false)
    }, 300)
  }

  const markAllAsRead = () => {
    setIsLoading(true)
    // Giả lập API call
    setTimeout(() => {
      setNotifications(
        notifications.map((n) => ({ ...n, read: true }))
      )
      setIsLoading(false)
    }, 300)
  }

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " " + t('notifications.timeAgo.years')
    
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " " + t('notifications.timeAgo.months')
    
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " " + t('notifications.timeAgo.days')
    
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " " + t('notifications.timeAgo.hours')
    
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " " + t('notifications.timeAgo.minutes')
    
    return Math.floor(seconds) + " " + t('notifications.timeAgo.seconds')
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "assignment":
        return <FileText className="h-4 w-4" />
      case "event":
        return <Calendar className="h-4 w-4" />
      case "material":
        return <Book className="h-4 w-4" />
      case "system":
        return <Info className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "assignment":
        return "text-blue-500 dark:text-blue-400"
      case "event":
        return "text-green-500 dark:text-green-400"
      case "material":
        return "text-purple-500 dark:text-purple-400"
      case "system":
        return "text-orange-500 dark:text-orange-400"
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full w-10 h-10 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Bell className="h-5 w-5" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t('notifications.title')}</p>
          </TooltipContent>
          <PopoverContent 
            className="w-80 p-0" 
            align="end"
            sideOffset={8}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold">{t('notifications.title')}</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={markAllAsRead}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {t('notifications.markAllAsRead')}
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[calc(100vh-20rem)] min-h-[300px]">
                {notifications.length > 0 ? (
                  <div className="grid gap-1 p-1">
                    <AnimatePresence>
                      {notifications.map((notification) => (
                        <motion.button
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn(
                            "w-full text-left p-4 space-y-1 hover:bg-accent rounded-lg transition-colors",
                            !notification.read && "bg-accent/50",
                            "relative overflow-hidden"
                          )}
                          onClick={() => !isLoading && markAsRead(notification.id)}
                          disabled={isLoading}
                        >
                          <div className="flex items-start gap-3">
                            <span className={cn("mt-1", getNotificationColor(notification.type))}>
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{notification.title}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {getTimeAgo(notification.time)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                          {/* Ripple effect */}
                          <span className="absolute inset-0 pointer-events-none bg-accent/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4 opacity-20" />
                    <p>{t('notifications.noNotifications')}</p>
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </PopoverContent>
        </Popover>
      </Tooltip>
    </TooltipProvider>
  )
} 