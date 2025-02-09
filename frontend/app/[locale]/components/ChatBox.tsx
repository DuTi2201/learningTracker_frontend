"use client"

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Loader2, MinimizeIcon, MaximizeIcon, Send, Plus, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createEvent, createGoal, createAssignment, createMaterial } from "../lib/api"
import Image from 'next/image'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CommandConfirmation {
  type: 'event' | 'goal' | 'assignment' | 'material'
  action: 'create' | 'update' | 'delete' | 'search' | 'filter' | 'stats'
  data: any
  missingFields: string[]
}

// Từ điển các từ khóa và cách diễn đạt
type ActionType = 'create' | 'update' | 'delete' | 'search' | 'filter' | 'stats'
type ObjectType = 'event' | 'goal' | 'assignment' | 'material'
type TimeType = 'today' | 'tomorrow' | 'nextWeek' | 'nextMonth'

const KEYWORDS = {
  actions: {
    create: ['thêm', 'tạo', 'thêm mới', 'tạo mới', 'thêm vào', 'lập', 'đặt'],
    update: ['sửa', 'cập nhật', 'chỉnh sửa', 'thay đổi', 'điều chỉnh'],
    delete: ['xóa', 'gỡ bỏ', 'loại bỏ', 'xóa bỏ', 'hủy'],
    search: ['tìm', 'tra cứu', 'xem', 'kiếm', 'tìm kiếm', 'tra', 'hiển thị'],
    filter: ['lọc', 'phân loại', 'sắp xếp', 'phân loại theo', 'sắp theo'],
    stats: ['thống kê', 'báo cáo', 'tổng kết', 'tổng hợp', 'phân tích']
  },
  types: {
    event: ['sự kiện', 'event', 'lịch', 'cuộc họp', 'buổi học', 'lớp'],
    goal: ['mục tiêu', 'goal', 'kế hoạch', 'mục đích', 'dự định'],
    assignment: ['bài tập', 'assignment', 'nhiệm vụ', 'công việc', 'bài'],
    material: ['tài liệu', 'material', 'học liệu', 'tài nguyên', 'document']
  },
  time: {
    today: ['hôm nay', 'ngày hôm nay', 'trong ngày'],
    tomorrow: ['ngày mai', 'hôm sau', 'ngày kế'],
    nextWeek: ['tuần sau', 'tuần tới', 'tuần kế'],
    nextMonth: ['tháng sau', 'tháng tới', 'tháng kế']
  },
  priority: {
    high: ['cao', 'quan trọng', 'gấp', 'ưu tiên cao'],
    medium: ['trung bình', 'bình thường'],
    low: ['thấp', 'không quan trọng', 'ưu tiên thấp']
  },
  status: {
    not_started: ['chưa bắt đầu', 'mới', 'chưa làm'],
    in_progress: ['đang làm', 'đang thực hiện', 'đang tiến hành'],
    completed: ['hoàn thành', 'xong', 'đã xong', 'kết thúc']
  }
}

// Di chuyển các hàm helper lên đầu
const findKeywordMatch = (text: string, keywordGroups: Record<string, string[]>) => {
  const words = text.toLowerCase().split(' ')
  for (const [key, keywords] of Object.entries(keywordGroups)) {
    if (keywords.some(keyword => 
      words.some(word => word.includes(keyword) || keyword.includes(word))
    )) {
      return key
    }
  }
  return null
}

const extractDateFromText = (text: string) => {
  const patterns = {
    today: /hôm nay|trong ngày/i,
    tomorrow: /ngày mai|hôm sau/i,
    nextWeek: /tuần sau|tuần tới/i,
    nextMonth: /tháng sau|tháng tới/i,
    specificDate: /ngày (\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/i,
  }

  const date = new Date()
  
  if (patterns.today.test(text)) {
    return date
  }
  if (patterns.tomorrow.test(text)) {
    date.setDate(date.getDate() + 1)
    return date
  }
  if (patterns.nextWeek.test(text)) {
    date.setDate(date.getDate() + 7)
    return date
  }
  if (patterns.nextMonth.test(text)) {
    date.setMonth(date.getMonth() + 1)
    return date
  }

  const specificMatch = text.match(patterns.specificDate)
  if (specificMatch) {
    const [_, day, month, year] = specificMatch
    date.setDate(parseInt(day))
    date.setMonth(parseInt(month) - 1)
    if (year) date.setFullYear(parseInt(year))
    return date
  }

  return null
}

const analyzeCommand = (input: string) => {
  const commandAction = findKeywordMatch(input, KEYWORDS.actions) as ActionType
  if (!commandAction) return null

  const type = findKeywordMatch(input, KEYWORDS.types) as ObjectType
  if (!type) return null

  const data: any = {}
  const missingFields: string[] = []

  // Xử lý tiêu đề
  const titleMatch = input.match(/'([^']*)'|"([^"]*)"/)
  if (titleMatch) {
    data.title = titleMatch[1] || titleMatch[2]
  } else {
    missingFields.push('title')
  }

  // Xử lý thời gian
  const date = extractDateFromText(input)
  if (date) {
    if (type === 'event') {
      data.start = date.toISOString()
      // Mặc định sự kiện kéo dài 1 giờ
      const endDate = new Date(date)
      endDate.setHours(endDate.getHours() + 1)
      data.end = endDate.toISOString()
    } else {
      data.deadline = date.toISOString()
    }
  } else {
    if (type === 'event') {
      missingFields.push('start')
      missingFields.push('end')
    } else if (['goal', 'assignment'].includes(type)) {
      missingFields.push('deadline')
    }
  }

  // Xử lý các trường bổ sung cho từng loại
  if (type === 'goal') {
    // Xử lý độ ưu tiên
    const priority = findKeywordMatch(input, KEYWORDS.priority)
    data.priority = priority || 'medium'
    
    // Xử lý trạng thái
    const status = findKeywordMatch(input, KEYWORDS.status)
    data.status = status || 'not_started'
    
    // Mô tả mặc định
    data.description = data.title ? `Mục tiêu: ${data.title}` : ''
  } else if (type === 'event') {
    // Thêm các trường cho sự kiện
    if (!data.description) {
      missingFields.push('description')
    }
    if (!data.instructor) {
      missingFields.push('instructor')
    }
  } else if (type === 'assignment') {
    // Thêm các trường cho bài tập
    data.status = 'not_started'
    if (!data.description) {
      missingFields.push('description')
    }
  }

  return {
    type,
    action: commandAction,
    data,
    missingFields
  } as CommandConfirmation
}

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [commandConfirmation, setCommandConfirmation] = useState<CommandConfirmation | null>(null)
  const [position, setPosition] = useState({ x: window.innerWidth - 76, y: window.innerHeight - 76 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const t = useTranslations()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLDivElement>(null)

  // Form schema cho các loại dữ liệu
  const eventSchema = z.object({
    title: z.string().min(1, "Tiêu đề là bắt buộc"),
    description: z.string().optional(),
    start: z.string().min(1, "Thời gian bắt đầu là bắt buộc"),
    end: z.string().min(1, "Thời gian kết thúc là bắt buộc"),
    instructor: z.string().optional()
  })

  const goalSchema = z.object({
    title: z.string().min(1, "Tiêu đề là bắt buộc"),
    description: z.string().optional(),
    deadline: z.string().min(1, "Thời hạn là bắt buộc"),
    priority: z.enum(["high", "medium", "low"]),
    status: z.enum(["not_started", "in_progress", "completed"])
  })

  // Form cho dialog xác nhận
  const form = useForm({
    resolver: zodResolver(commandConfirmation?.type === 'event' ? eventSchema : goalSchema),
    defaultValues: commandConfirmation?.data ? {
      title: commandConfirmation.data.title,
      description: commandConfirmation.data.description,
      start: commandConfirmation.data.start ? new Date(commandConfirmation.data.start).toISOString().slice(0, 16) : undefined,
      end: commandConfirmation.data.end ? new Date(commandConfirmation.data.end).toISOString().slice(0, 16) : undefined,
      deadline: commandConfirmation.data.deadline ? new Date(commandConfirmation.data.deadline).toISOString().slice(0, 16) : undefined,
      priority: commandConfirmation.data.priority,
      status: commandConfirmation.data.status,
      instructor: commandConfirmation.data.instructor
    } : {}
  })

  // Log để debug
  useEffect(() => {
    if (commandConfirmation) {
      console.log('Command Confirmation:', commandConfirmation)
      console.log('Form Default Values:', form.getValues())
    }
  }, [commandConfirmation])

  // Reset form khi commandConfirmation thay đổi
  useEffect(() => {
    if (commandConfirmation?.data) {
      console.log('Resetting form with data:', commandConfirmation.data)
      form.reset({
        title: commandConfirmation.data.title,
        description: commandConfirmation.data.description,
        start: commandConfirmation.data.start ? new Date(commandConfirmation.data.start).toISOString().slice(0, 16) : undefined,
        end: commandConfirmation.data.end ? new Date(commandConfirmation.data.end).toISOString().slice(0, 16) : undefined,
        deadline: commandConfirmation.data.deadline ? new Date(commandConfirmation.data.deadline).toISOString().slice(0, 16) : undefined,
        priority: commandConfirmation.data.priority,
        status: commandConfirmation.data.status,
        instructor: commandConfirmation.data.instructor
      })
    }
  }, [commandConfirmation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleNewChat = () => {
    setMessages([])
    setShowHistory(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const input = inputRef.current?.value || ''
    if (!input.trim()) return
    
    // Thêm tin nhắn của người dùng vào lịch sử
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    // Reset input và scroll xuống cuối
    if (inputRef.current) inputRef.current.value = ''
    scrollToBottom()

    try {
      setIsLoading(true)
      
      // Phân tích command
      const command = analyzeCommand(input)
      if (!command) {
        // Nếu không phải là command, gửi đến AI để xử lý
        // ... existing AI processing code ...
        return
      }

      // Nếu là command tạo mới và thiếu thông tin
      if (command.action === 'create' && command.missingFields.length > 0) {
        // Hiển thị dialog với form tương ứng
        setCommandConfirmation(command)
        
        // Thêm tin nhắn hướng dẫn
        const missingFieldsMessage = command.missingFields
          .map(field => t(`${command.type}.form.${field}`))
          .join(', ')
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t('common.missingFields', { fields: missingFieldsMessage }),
          timestamp: new Date()
        }])
        return
      }

      // Nếu đủ thông tin, thực hiện tạo mới
      if (command.action === 'create') {
        const result = await handleCommandConfirm(command.data)
        
        // Thêm tin nhắn thành công
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: t(`${command.type}.createSuccess`),
          timestamp: new Date()
        }])
      }
      // ... handle other actions ...

    } catch (error) {
      console.error('Error handling command:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('chat.error'),
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  // Xử lý khi user xác nhận thực hiện command
  const handleCommandConfirm = async (formData: any) => {
    console.log('Form Data on Submit:', formData)
    if (!commandConfirmation) return

    try {
      console.log('Executing command with data:', { ...commandConfirmation.data, ...formData })
      let result
      const { type, action, data } = commandConfirmation
      const finalData = { ...data, ...formData }

      switch (action) {
        case 'create':
          switch (type) {
            case 'event':
              result = await createEvent(finalData)
              break
            case 'goal':
              result = await createGoal(finalData)
              break
            case 'assignment':
              result = await createAssignment(finalData)
              break
            case 'material':
              result = await createMaterial(finalData)
              break
          }
          break
        
        case 'search':
          // Thực hiện tìm kiếm
          break
        
        case 'filter':
          // Thực hiện lọc
          break
        
        case 'stats':
          // Thực hiện thống kê
          break
      }

      const successMessage: Message = {
        role: 'assistant',
        content: getSuccessMessage(action, type),
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, successMessage])
    } catch (error) {
      console.error('Command execution error:', error)
      const errorMessage: Message = {
        role: 'assistant', 
        content: getErrorMessage(error),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setCommandConfirmation(null)
    }
  }

  // Helper functions
  const getSuccessMessage = (action: string, type: string) => {
    switch (action) {
      case 'create':
        return `Đã thêm ${type} thành công!`
      case 'update':
        return `Đã cập nhật ${type} thành công!`
      case 'delete':
        return `Đã xóa ${type} thành công!`
      case 'search':
        return `Đã tìm thấy kết quả cho ${type}!`
      case 'filter':
        return `Đã lọc ${type} theo yêu cầu!`
      case 'stats':
        return `Đã thống kê ${type} thành công!`
      default:
        return 'Thao tác thành công!'
    }
  }

  const getErrorMessage = (error: any) => {
    if (error.message.includes('validation')) {
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.'
    }
    if (error.message.includes('not found')) {
      return 'Không tìm thấy dữ liệu yêu cầu.'
    }
    if (error.message.includes('permission')) {
      return 'Bạn không có quyền thực hiện thao tác này.'
    }
    return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
  }

  // Xử lý kéo thả
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonRef.current) return
    setIsDragging(true)
    const rect = buttonRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    const newX = Math.min(Math.max(0, e.clientX - dragOffset.x), window.innerWidth - 60)
    const newY = Math.min(Math.max(0, e.clientY - dragOffset.y), window.innerHeight - 60)
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <>
      {!isOpen ? (
        <div
          ref={buttonRef}
          className="fixed cursor-move hover:scale-110 transition-transform"
          onClick={() => setIsOpen(true)}
          onMouseDown={handleMouseDown}
          style={{
            right: `20px`,
            bottom: '20px',
            width: '90px',
            height: '90px',
            zIndex: 50
          }}
        >
          <Image
            src="/aiLogo.svg"
            alt="AI Chat"
            width={90}
            height={90}
            className="pointer-events-none"
            priority
          />
        </div>
      ) : (
        <>
          <div 
            className="fixed w-[400px] rounded-lg border bg-background shadow-xl"
            style={{
              left: position.x < window.innerWidth / 2 ? `${position.x}px` : undefined,
              right: position.x >= window.innerWidth / 2 ? `${window.innerWidth - position.x - 60}px` : undefined,
              bottom: position.y >= window.innerHeight / 2 ? '1rem' : undefined,
              top: position.y < window.innerHeight / 2 ? `${position.y}px` : undefined,
            }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{t('chat.title')}</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-accent/50 transition-colors"
                  onClick={() => setShowHistory(!showHistory)}
                  title={t('chat.history')}
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-accent/50 transition-colors"
                  onClick={handleNewChat}
                  title={t('chat.newChat')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {isMinimized ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMinimized(false)}
                    title={t('chat.maximize')}
                  >
                    <MaximizeIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMinimized(true)}
                    title={t('chat.minimize')}
                  >
                    <MinimizeIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  title={t('chat.close')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder={t('chat.inputPlaceholder')}
                      disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Dialog xác nhận command */}
          {commandConfirmation && (
            <Dialog open={!!commandConfirmation} onOpenChange={() => setCommandConfirmation(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {commandConfirmation?.action === 'create' && t(`${commandConfirmation.type}.addNew`)}
                    {commandConfirmation?.action === 'update' && t(`${commandConfirmation.type}.edit`)}
                    {commandConfirmation?.action === 'delete' && t('common.deleteConfirm.title')}
                  </DialogTitle>
                  <DialogDescription>
                    {commandConfirmation?.action === 'delete' 
                      ? t('common.deleteConfirm.description')
                      : t(`${commandConfirmation?.type}.form.formDescription`)}
                  </DialogDescription>
                </DialogHeader>

                {/* Preview section if data is available */}
                {commandConfirmation?.data && Object.keys(commandConfirmation.data).length > 0 && (
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium text-sm">{t('common.preview')}:</h4>
                    {Object.entries(commandConfirmation.data).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{t(`${commandConfirmation?.type}.form.${key}`)}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form fields based on type */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCommandConfirm)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t(`${commandConfirmation?.type}.form.title`)}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              placeholder={t(`${commandConfirmation?.type}.form.titlePlaceholder`)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t(`${commandConfirmation?.type}.form.description`)}</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder={t(`${commandConfirmation?.type}.form.descriptionPlaceholder`)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date/Time fields for events */}
                    {commandConfirmation?.type === 'event' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="start"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('events.form.startTime')}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="datetime-local"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="end"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('events.form.endTime')}</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="datetime-local"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="instructor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('events.form.instructor')}</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder={t('events.form.instructorPlaceholder')}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Deadline field for goals and assignments */}
                    {(commandConfirmation?.type === 'goal' || commandConfirmation?.type === 'assignment') && (
                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t(`${commandConfirmation?.type}.form.deadline`)}</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="datetime-local"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Priority and status fields for goals */}
                    {commandConfirmation?.type === 'goal' && (
                      <>
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('goals.form.priority')}</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={commandConfirmation?.data?.priority || 'medium'}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('goals.form.selectPriority')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="high">{t('goals.priority.high')}</SelectItem>
                                  <SelectItem value="medium">{t('goals.priority.medium')}</SelectItem>
                                  <SelectItem value="low">{t('goals.priority.low')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('goals.form.status')}</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={commandConfirmation?.data?.status || 'not_started'}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('goals.form.selectStatus')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="not_started">{t('goals.status.not_started')}</SelectItem>
                                  <SelectItem value="in_progress">{t('goals.status.in_progress')}</SelectItem>
                                  <SelectItem value="completed">{t('goals.status.completed')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Missing fields section */}
                    {commandConfirmation?.missingFields.length > 0 && (
                      <div className="space-y-2 p-4 rounded-lg bg-destructive/10">
                        <h4 className="font-medium text-sm text-destructive">{t('common.missingFields')}:</h4>
                        <ul className="list-disc list-inside text-sm text-destructive">
                          {commandConfirmation.missingFields.map(field => (
                            <li key={field}>
                              {t(`${commandConfirmation.type}.form.${field}`, {
                                defaultValue: t(`common.form.${field}`, { defaultValue: field })
                              })}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                        {commandConfirmation?.action === 'create' ? t('common.create') : t('common.update')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </>
  )
}