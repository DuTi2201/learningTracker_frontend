"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LearningProgressChart from "../../components/LearningProgressChart"
import { useTranslations } from 'next-intl'
import { getDashboardStats } from "../../lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Target, TrendingUp, Trophy, CheckCircle, ArrowUpCircle, AlertCircle, Lightbulb, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Bar } from "react-chartjs-2"

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
  analysis: {
    trends: {
      studyHours: number
      assignments: number
      goals: number
    }
    optimalSchedule: {
      hourlyDistribution: number[]
      mostProductiveHours: [number, number][]
      weekdayDistribution: number[]
    }
  }
  recommendations: {
    area: string
    suggestion: string
    priority: 'high' | 'medium' | 'low'
    materials?: any[]
  }[]
  summary: {
    overallProgress: number
    strengths: string[]
    areasForImprovement: string[]
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

        <Card className="col-span-full mb-8">
          <CardHeader>
            <CardTitle>{t('dashboard.learningProgress')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LearningProgressChart data={stats?.learningProgress} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Tiến độ tổng thể
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hoàn thành</span>
                <span className="text-sm font-medium">{stats?.summary.overallProgress}%</span>
              </div>
              <Progress value={stats?.summary.overallProgress} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Xu hướng học tập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Thời gian học</span>
                <Badge variant={(stats?.analysis.trends.studyHours ?? 0) > 0 ? "default" : "destructive"}>
                  {(stats?.analysis.trends.studyHours ?? 0) > 0 ? "+" : ""}{stats?.analysis.trends.studyHours ?? 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bài tập hoàn thành</span>
                <Badge variant={(stats?.analysis.trends.assignments ?? 0) > 0 ? "default" : "destructive"}>
                  {(stats?.analysis.trends.assignments ?? 0) > 0 ? "+" : ""}{stats?.analysis.trends.assignments ?? 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mục tiêu đạt được</span>
                <Badge variant={(stats?.analysis.trends.goals ?? 0) > 0 ? "default" : "destructive"}>
                  {(stats?.analysis.trends.goals ?? 0) > 0 ? "+" : ""}{stats?.analysis.trends.goals ?? 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-4 h-4 mr-2" />
              Điểm mạnh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats?.summary.strengths.map((strength, index) => (
                <li key={index} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Điểm cần cải thiện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {stats?.summary.areasForImprovement.map((area, index) => (
                <li key={index} className="flex items-center text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                  {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" />
            Đề xuất cải thiện
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recommendations.map((rec, index) => (
              <div key={index} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{rec.area}</h4>
                  <Badge variant={
                    rec.priority === 'high' ? "destructive" : 
                    rec.priority === 'medium' ? "secondary" : 
                    "default"
                  }>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.suggestion}</p>
                {rec.materials && (
                  <div className="mt-2">
                    <h5 className="text-sm font-medium mb-2">Tài liệu đề xuất:</h5>
                    <ul className="space-y-1">
                      {rec.materials.map((material, idx) => (
                        <li key={idx} className="text-sm">
                          <Link href={`/materials/${material.id}`} className="text-blue-500 hover:underline">
                            {material.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Lịch học tối ưu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Thời gian học hiệu quả nhất:</h4>
              <div className="flex flex-wrap gap-2">
                {stats?.analysis.optimalSchedule.mostProductiveHours.map(([hour, duration], index) => (
                  <Badge key={index} variant="outline">
                    {hour}:00 - {hour + 1}:00 ({Math.round(duration)}h)
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Phân bố học tập trong tuần:</h4>
              <div className="h-40">
                <Bar
                  data={{
                    labels: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
                    datasets: [{
                      label: 'Số giờ học',
                      data: stats?.analysis.optimalSchedule.weekdayDistribution || [],
                      backgroundColor: 'rgba(75, 192, 192, 0.5)',
                      borderColor: 'rgb(75, 192, 192)',
                      borderWidth: 1,
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `${value}h`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
 