"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import LearningProgressChart from "./components/LearningProgressChart"

export default function Dashboard() {
  const { toast } = useToast()

  useEffect(() => {
    toast({
      title: "Welcome back!",
      description: "You have 2 upcoming events today.",
    })
  }, [toast]) // Added toast to dependencies

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Welcome back, Learner!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={33} className="w-full" />
            <p className="mt-2 text-sm text-gray-600">You've completed 33% of your goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">You have 2 events scheduled for today</p>
            <Button asChild className="mt-4">
              <Link href="/events">
                View Events <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">You've added 3 new study materials this week</p>
            <Button asChild className="mt-4">
              <Link href="/materials">
                View Materials <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Learning Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <LearningProgressChart />
        </CardContent>
      </Card>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quote of the Day</CardTitle>
        </CardHeader>
        <CardContent>
          <blockquote className="italic text-lg text-gray-700">
            "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice."
          </blockquote>
          <p className="mt-2 text-sm text-gray-600">- Brian Herbert</p>
        </CardContent>
      </Card>
    </div>
  )
}

