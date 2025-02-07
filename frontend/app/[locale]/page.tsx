"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LearningProgressChart from "./components/LearningProgressChart"
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations()
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.totalLessons')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">
            +2 {t('dashboard.fromLastWeek')}
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
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">
            +4 {t('dashboard.fromLastWeek')}
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
          <div className="text-2xl font-bold">36</div>
          <p className="text-xs text-muted-foreground">
            +8 {t('dashboard.fromLastWeek')}
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
          <div className="text-2xl font-bold">8</div>
          <p className="text-xs text-muted-foreground">
            +1 {t('dashboard.fromLastWeek')}
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t('dashboard.learningProgress')}</CardTitle>
        </CardHeader>
        <CardContent>
          <LearningProgressChart />
        </CardContent>
      </Card>
    </div>
  )
} 