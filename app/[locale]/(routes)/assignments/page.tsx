"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FileText, Calendar, CheckCircle2, Pencil, Trash2, X, CircleCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { assignments as mockAssignments, materials as existingMaterials } from "../../lib/mockData"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { MaterialSelector } from "../../components/assignments/MaterialSelector"
import type { Material } from "../../lib/mockData"
import { useTranslations } from 'next-intl'
import { AssignmentDetailModal } from "../../components/assignments/AssignmentDetailModal"

interface Assignment {
  id: number
  title: string
  description: string
  deadline: string
  status: "not_started" | "in_progress" | "completed"
  notes: string
  materials: Material[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "not_started":
      return "text-yellow-500"
    case "in_progress":
      return "text-blue-500"
    case "completed":
      return "text-green-500"
    default:
      return ""
  }
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null)
  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    title: "",
    description: "",
    deadline: "",
    status: "not_started",
    notes: "",
  })
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const { toast } = useToast()
  const t = useTranslations()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssignment.title || !newAssignment.deadline) {
      toast({
        title: t('assignments.validation.required'),
        description: t('assignments.validation.titleDeadlineRequired'),
        variant: "destructive",
      })
      return
    }

    const newItem: Assignment = {
      id: Math.max(...assignments.map((a) => a.id)) + 1,
      title: newAssignment.title,
      description: newAssignment.description || "",
      deadline: newAssignment.deadline,
      status: newAssignment.status as "not_started" | "in_progress" | "completed",
      notes: newAssignment.notes || "",
      materials: selectedMaterials,
    }

    setAssignments([...assignments, newItem])
    setNewAssignment({
      title: "",
      description: "",
      deadline: "",
      status: "not_started",
      notes: "",
    })
    setSelectedMaterials([])
    setIsDialogOpen(false)
    toast({
      title: t('assignments.created'),
      description: t('assignments.createSuccess'),
    })
  }

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAssignment) return

    const updatedAssignments = assignments.map((assignment) =>
      assignment.id === editingAssignment.id ? editingAssignment : assignment
    )

    setAssignments(updatedAssignments)
    setEditingAssignment(null)
    toast({
      title: t('assignments.updated'),
      description: t('assignments.updateSuccess'),
    })
  }

  const handleDelete = (assignment: Assignment) => {
    setAssignmentToDelete(assignment)
    setShowDeleteAlert(true)
  }

  const confirmDelete = () => {
    if (!assignmentToDelete) return

    setAssignments(assignments.filter((a) => a.id !== assignmentToDelete.id))
    setShowDeleteAlert(false)
    setAssignmentToDelete(null)
    toast({
      title: t('assignments.deleted'),
      description: t('assignments.deleteSuccess'),
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">{t('assignments.title')}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Danh sách bài tập */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('assignments.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">{assignment.title}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{t('assignments.deadline')}: {assignment.deadline}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CircleCheck className={cn(
                            "h-4 w-4",
                            assignment.status === "completed" ? "text-green-500" :
                            assignment.status === "in_progress" ? "text-yellow-500" :
                            "text-muted-foreground"
                          )} />
                          <span className={cn(
                            assignment.status === "completed" ? "text-green-500" :
                            assignment.status === "in_progress" ? "text-yellow-500" :
                            "text-muted-foreground"
                          )}>
                            {t(`assignments.status.${assignment.status}`)}
                          </span>
                        </div>
                      </div>
                      {assignment.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">{t('assignments.notes')}:</span> {assignment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Form thêm bài tập mới */}
        <div>
          <Card>
            <CardHeader className="relative">
              <CardTitle>{t('assignments.addNew')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('assignments.form.title')}</Label>
                  <Input
                    id="title"
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, title: e.target.value })
                    }
                    placeholder={t('assignments.form.titlePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('assignments.form.description')}</Label>
                  <Textarea
                    id="description"
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, description: e.target.value })
                    }
                    placeholder={t('assignments.form.descriptionPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">{t('assignments.form.deadline')}</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newAssignment.deadline}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, deadline: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('assignments.form.status')}</Label>
                  <Select
                    value={newAssignment.status}
                    onValueChange={(value) =>
                      setNewAssignment({ ...newAssignment, status: value as Assignment["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('assignments.form.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">{t('assignments.status.not_started')}</SelectItem>
                      <SelectItem value="in_progress">{t('assignments.status.in_progress')}</SelectItem>
                      <SelectItem value="completed">{t('assignments.status.completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t('assignments.form.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={newAssignment.notes}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, notes: e.target.value })
                    }
                    placeholder={t('assignments.form.notesPlaceholder')}
                  />
                </div>

                <MaterialSelector
                  selectedMaterials={selectedMaterials}
                  onSelectMaterials={setSelectedMaterials}
                  existingMaterials={existingMaterials}
                />

                <Button type="submit" className="w-full">
                  {t('assignments.form.submit')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog chỉnh sửa bài tập */}
      <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignments.edit')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('assignments.form.title')}</Label>
              <Input
                id="edit-title"
                value={editingAssignment?.title || ""}
                onChange={(e) =>
                  setEditingAssignment(
                    editingAssignment
                      ? { ...editingAssignment, title: e.target.value }
                      : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('assignments.form.description')}</Label>
              <Textarea
                id="edit-description"
                value={editingAssignment?.description || ""}
                onChange={(e) =>
                  setEditingAssignment(
                    editingAssignment
                      ? { ...editingAssignment, description: e.target.value }
                      : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">{t('assignments.form.deadline')}</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={editingAssignment?.deadline || ""}
                onChange={(e) =>
                  setEditingAssignment(
                    editingAssignment
                      ? { ...editingAssignment, deadline: e.target.value }
                      : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t('assignments.form.status')}</Label>
              <Select
                value={editingAssignment?.status || ""}
                onValueChange={(value) =>
                  setEditingAssignment(
                    editingAssignment
                      ? { ...editingAssignment, status: value as Assignment["status"] }
                      : null
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">{t('assignments.status.not_started')}</SelectItem>
                  <SelectItem value="in_progress">{t('assignments.status.in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('assignments.status.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t('assignments.form.notes')}</Label>
              <Textarea
                id="edit-notes"
                value={editingAssignment?.notes || ""}
                onChange={(e) =>
                  setEditingAssignment(
                    editingAssignment
                      ? { ...editingAssignment, notes: e.target.value }
                      : null
                  )
                }
              />
            </div>
            <MaterialSelector
              selectedMaterials={editingAssignment?.materials || []}
              onSelectMaterials={(materials) =>
                setEditingAssignment(
                  editingAssignment
                    ? { ...editingAssignment, materials }
                    : null
                )
              }
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingAssignment(null)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.update')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog xác nhận xóa */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('assignments.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('assignments.deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssignmentToDelete(null)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add AssignmentDetailModal */}
      <AssignmentDetailModal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onEdit={handleEdit}
        onDelete={(assignmentId) => handleDelete(assignments.find(a => a.id === assignmentId)!)}
        assignment={selectedAssignment}
      />
    </div>
  )
}

