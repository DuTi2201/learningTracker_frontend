import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { FileText, Calendar, CircleCheck, Trash2, Pencil, AlignLeft, StickyNote, BookOpen } from "lucide-react"
import { useState } from "react"
import type { Assignment } from "../../lib/types"
import { useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"

interface AssignmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (assignment: Assignment) => void
  onDelete: (id: number) => void
  assignment: Assignment | null
}

export function AssignmentDetailModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  assignment 
}: AssignmentDetailModalProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const t = useTranslations()

  if (!assignment) return null

  const handleDelete = () => {
    if (!assignment) return;
    onDelete(assignment.id);
    setShowDeleteAlert(false);
    onClose();
  }

  const handleEdit = () => {
    onEdit(assignment)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <h2 className="tracking-tight text-xl font-semibold">
              {assignment.title}
            </h2>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{t('assignments.deadline')}</div>
                <div className="text-sm text-muted-foreground">
                  {assignment.deadline}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CircleCheck className={cn(
                "h-5 w-5 mt-0.5",
                assignment.status === "completed" ? "text-green-500" :
                assignment.status === "in_progress" ? "text-yellow-500" :
                "text-muted-foreground"
              )} />
              <div>
                <div className="font-medium">{t('assignments.form.status')}</div>
                <div className="text-sm text-muted-foreground">
                  {t(`assignments.status.${assignment.status}`)}
                </div>
              </div>
            </div>

            {assignment.description && (
              <div className="flex items-start gap-3">
                <AlignLeft className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{t('assignments.form.description')}</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.description}
                  </div>
                </div>
              </div>
            )}

            {assignment.notes && (
              <div className="flex items-start gap-3">
                <StickyNote className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{t('assignments.notes')}</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.notes}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{t('assignments.materials')}</div>
                {assignment.materials && assignment.materials.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {assignment.materials.map((material) => (
                      <a
                        key={material.id}
                        href={material.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        {material.title}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground mt-2 italic">
                    {t('assignments.noMaterials')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between gap-2">
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteAlert(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t('common.delete')}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                {t('common.edit')}
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('assignments.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('assignments.deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 