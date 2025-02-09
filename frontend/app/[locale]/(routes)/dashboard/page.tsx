"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LearningProgressChart from "../../components/LearningProgressChart"
import { useTranslations } from 'next-intl'
import { getDashboardStats } from "../../lib/api"
import { useToast } from "@/components/ui/use-toast"

interface DashboardStats {
  totalLessons: number
  totalLessonsLastWeek: number
  completedAssignments: number
  completedAssignmentsLastWeek: number
  studyHours: number
  completedGoals: number
  completedGoalsLastWeek: number
  learningProgress: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
    }[]
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const t = useTranslations()
  const { toast } = useToast()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        toast({
          title: t('dashboard.error.title'),
          description: t('dashboard.error.description'),
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [toast, t])
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">{t('nav.dashboard')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">{t('nav.dashboard')}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalLessons')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLessons || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.totalLessonsLastWeek || 0} {t('dashboard.fromLastWeek')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.completedAssignments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.completedAssignmentsLastWeek || 0} {t('dashboard.fromLastWeek')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.studyHours')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.studyHours || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.totalHours')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.completedGoals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedGoals || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.completedGoalsLastWeek || 0} {t('dashboard.fromLastWeek')}
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>{t('dashboard.learningProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LearningProgressChart data={stats?.learningProgress} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
 