'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Dữ liệu được coi là "fresh" trong 1 phút
            gcTime: 5 * 60 * 1000, // Cache được giữ trong 5 phút
            refetchOnWindowFocus: false, // Không tự động fetch lại khi focus window
            retry: 1, // Thử lại 1 lần nếu request thất bại
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
} 