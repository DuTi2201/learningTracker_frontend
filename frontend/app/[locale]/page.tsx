"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">
          {t('home.welcome')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {t('home.description')}
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">
            {t('home.viewDashboard')} <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  )
} 