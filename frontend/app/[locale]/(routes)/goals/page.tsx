"use client"

import { useState } from "react"
import { goals as initialGoals } from "../../lib/mockData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, MoreVertical, Plus, Search, Trash } from "lucide-react"
import { GoalForm } from "../../components/goals/GoalForm"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from 'next-intl'

interface Goal {
  id: number
  title: string
  description: string
  deadline: string
  priority: "high" | "medium" | "low"
  status: "not_started" | "in_progress" | "completed"
}

export default function Goals() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const { toast } = useToast()
  const t = useTranslations()

  const filteredGoals = goals.filter(
    (goal) =>
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) && (filter === "all" || goal.status === filter),
  )

  const handleCreateGoal = (data: Omit<Goal, "id">) => {
    const newGoal: Goal = {
      id: Math.max(...goals.map((g) => g.id)) + 1,
      ...data,
    }
    setGoals([...goals, newGoal])
    toast({
      title: t('goals.created'),
      description: t('goals.createSuccess'),
    })
  }

  const handleUpdateGoal = (data: Partial<Omit<Goal, "id">>) => {
    if (!editingGoal) return
    const updatedGoals = goals.map((goal) => 
      goal.id === editingGoal.id ? { ...goal, ...data } : goal
    )
    setGoals(updatedGoals)
    setEditingGoal(null)
    toast({
      title: t('goals.updated'),
      description: t('goals.updateSuccess'),
    })
  }

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter((goal) => goal.id !== id))
    toast({
      title: t('goals.deleted'),
      description: t('goals.deleteSuccess'),
    })
  }

  const getStatusText = (status: Goal["status"]) => {
    switch (status) {
      case 'not_started':
        return t('goals.status.not_started')
      case 'in_progress':
        return t('goals.status.in_progress')
      case 'completed':
        return t('goals.status.completed')
      default:
        return status
    }
  }

  const getPriorityText = (priority: Goal["priority"]) => {
    switch (priority) {
      case 'high':
        return t('goals.priority.high')
      case 'medium':
        return t('goals.priority.medium')
      case 'low':
        return t('goals.priority.low')
      default:
        return priority
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{t('goals.title')}</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('goals.addNew')}
        </Button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <Input
            type="search"
            placeholder={t('goals.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-64"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">{t('goals.filter.all')}</option>
          <option value="not_started">{t('goals.filter.notStarted')}</option>
          <option value="in_progress">{t('goals.filter.inProgress')}</option>
          <option value="completed">{t('goals.filter.completed')}</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{goal.title}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingGoal(goal)
                      setIsFormOpen(true)
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteGoal(goal.id)}>
                    <Trash className="mr-2 h-4 w-4" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
              <p className="text-sm text-gray-600">{t('goals.deadline')}: {goal.deadline}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant={
                    goal.priority === "high" ? "destructive" : goal.priority === "medium" ? "default" : "secondary"
                  }
                >
                  {getPriorityText(goal.priority)}
                </Badge>
                <Badge
                  variant={
                    goal.status === "completed" ? "secondary" : goal.status === "in_progress" ? "default" : "outline"
                  }
                >
                  {getStatusText(goal.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <GoalForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingGoal(null)
        }}
        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
        initialData={editingGoal ? {
          title: editingGoal.title,
          description: editingGoal.description,
          deadline: editingGoal.deadline,
          priority: editingGoal.priority,
          status: editingGoal.status
        } : undefined}
      />
    </div>
  )
} 