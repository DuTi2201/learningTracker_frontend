"use client"

import { useState } from "react"
import { goals as initialGoals } from "../lib/mockData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit, MoreVertical, Plus, Search, Trash } from "lucide-react"
import { GoalForm } from "../components/goals/GoalForm"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export default function Goals() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [goals, setGoals] = useState(initialGoals)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<(typeof goals)[0] | null>(null)
  const { toast } = useToast()

  const filteredGoals = goals.filter(
    (goal) =>
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) && (filter === "all" || goal.status === filter),
  )

  const handleCreateGoal = (data: any) => {
    const newGoal = {
      id: Math.max(...goals.map((g) => g.id)) + 1,
      ...data,
    }
    setGoals([...goals, newGoal])
  }

  const handleUpdateGoal = (data: any) => {
    if (!editingGoal) return
    const updatedGoals = goals.map((goal) => (goal.id === editingGoal.id ? { ...goal, ...data } : goal))
    setGoals(updatedGoals)
    setEditingGoal(null)
  }

  const handleDeleteGoal = (id: number) => {
    setGoals(goals.filter((goal) => goal.id !== id))
    toast({
      title: "Goal deleted",
      description: "The goal has been successfully deleted.",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Learning Goals</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Goal
        </Button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search goals..."
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
          <option value="all">All</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
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
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteGoal(goal.id)}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
              <p className="text-sm text-gray-600">Deadline: {goal.deadline}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant={
                    goal.priority === "high" ? "destructive" : goal.priority === "medium" ? "default" : "secondary"
                  }
                >
                  {goal.priority}
                </Badge>
                <Badge
                  variant={
                    goal.status === "completed" ? "success" : goal.status === "in_progress" ? "warning" : "default"
                  }
                >
                  {goal.status.replace("_", " ")}
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
        initialData={editingGoal || undefined}
      />
    </div>
  )
}

