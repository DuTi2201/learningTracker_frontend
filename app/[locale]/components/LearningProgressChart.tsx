"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useLocale } from 'next-intl'
import { type Locale } from '@/config/i18n'

const weekDays = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  vi: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
}

export default function LearningProgressChart() {
  const locale = useLocale() as Locale
  
  const data = weekDays[locale].map((day, index) => ({
    name: day,
    total: [2.4, 1.8, 2.8, 2.6, 3.2, 2.0, 1.4][index],
  }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}h`}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

