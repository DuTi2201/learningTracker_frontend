"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FileText, Calendar, CheckCircle2, Pencil, Trash2, X, CircleCheck, Search } from "lucide-react"
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
import { MaterialSelector, type Material } from "../../components/shared/MaterialSelector"
import { useTranslations } from 'next-intl'
import { AssignmentDetailModal } from "../../components/assignments/AssignmentDetailModal"
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from "../../lib/api"

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
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("deadline")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      const data = await getAssignments()
      setAssignments(data)
    } catch (error) {
      toast({
        title: t('assignments.error.load'),
        description: t('assignments.error.loadDescription'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssignment.title || !newAssignment.deadline) {
      toast({
        title: t('assignments.validation.required'),
        description: t('assignments.validation.titleDeadlineRequired'),
        variant: "destructive",
      })
      return
    }

    try {
      const newItem = {
        title: newAssignment.title,
        description: newAssignment.description || "",
        deadline: newAssignment.deadline,
        status: newAssignment.status as "not_started" | "in_progress" | "completed",
        notes: newAssignment.notes || "",
        materials: selectedMaterials,
      }

      const createdAssignment = await createAssignment(newItem)
      setAssignments([...assignments, createdAssignment])
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
    } catch (error) {
      toast({
        title: t('assignments.error.create'),
        description: t('assignments.error.createDescription'),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment)
  }

  const handleUpdate = async () => {
    if (!editingAssignment) return

    try {
      const updatedAssignment = await updateAssignment(editingAssignment.id, editingAssignment)
      setAssignments(assignments.map(a => a.id === updatedAssignment.id ? updatedAssignment : a))
      setEditingAssignment(null)
      toast({
        title: t('assignments.updated'),
        description: t('assignments.updateSuccess'),
      })
    } catch (error) {
      toast({
        title: t('assignments.error.update'),
        description: t('assignments.error.updateDescription'),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAssignment(id)
      setAssignments(assignments.filter(a => a.id !== id))
      setAssignmentToDelete(null)
      setShowDeleteAlert(false)
      toast({
        title: t('assignments.deleted'),
        description: t('assignments.deleteSuccess'),
      })
    } catch (error) {
      toast({
        title: t('assignments.error.delete'),
        description: t('assignments.error.deleteDescription'),
        variant: "destructive",
      })
    }
  }

  // Lọc và sắp xếp assignments
  const filteredAssignments = assignments
    .filter(assignment => {
      // Tìm kiếm theo tiêu đề
      const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Lọc theo trạng thái
      const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
      
      // Lọc theo thời gian
      const deadline = new Date(assignment.deadline);
      const today = new Date();
      const thisWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      let matchesDate = true;
      if (dateFilter === "today") {
        matchesDate = deadline.toDateString() === today.toDateString();
      } else if (dateFilter === "thisWeek") {
        matchesDate = deadline >= thisWeek && deadline <= new Date(thisWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === "thisMonth") {
        matchesDate = deadline >= thisMonth && deadline <= new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === "deadline") {
        return sortOrder === "asc" 
          ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          : new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      } else if (sortBy === "status") {
        const statusOrder = { completed: 3, in_progress: 2, not_started: 1 };
        return sortOrder === "asc"
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
      }
      return 0;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end items-center mb-6">
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> {t('assignments.addNew')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Danh sách bài tập */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="flex flex-col space-y-4 pb-2">
              <div className="flex flex-row items-center justify-between">
                <CardTitle>{t('assignments.title')}</CardTitle>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder={t('assignments.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('assignments.filterStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('assignments.filter.allStatus')}</SelectItem>
                    <SelectItem value="not_started">{t('assignments.status.not_started')}</SelectItem>
                    <SelectItem value="in_progress">{t('assignments.status.in_progress')}</SelectItem>
                    <SelectItem value="completed">{t('assignments.status.completed')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('assignments.filterDate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('assignments.filter.allTime')}</SelectItem>
                    <SelectItem value="today">{t('assignments.filter.today')}</SelectItem>
                    <SelectItem value="thisWeek">{t('assignments.filter.thisWeek')}</SelectItem>
                    <SelectItem value="thisMonth">{t('assignments.filter.thisMonth')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => {
                  setSortBy(value);
                  setSortOrder("asc");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('assignments.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deadline">{t('assignments.sort.deadline')}</SelectItem>
                    <SelectItem value="status">{t('assignments.sort.status')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  {t('common.loading')}
                </div>
              ) : filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment) => (
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
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {t('assignments.noAssignments')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog thêm bài tập mới */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignments.addNew')}</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction onClick={() => handleDelete(assignmentToDelete!.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        onDelete={(id) => handleDelete(id)}
        assignment={selectedAssignment}
      />
    </div>
  )
}

