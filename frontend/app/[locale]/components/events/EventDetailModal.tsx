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
import { Clock, FileText, User, Trash2, Edit } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import type { Event } from "../../lib/mockData"
import { useTranslations } from 'next-intl'

interface EventDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (event: Event) => void
  onDelete: (eventId: string) => void
  event: Event | null
}

export function EventDetailModal({ isOpen, onClose, onEdit, onDelete, event }: EventDetailModalProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const t = useTranslations()

  if (!event) return null

  const handleDelete = () => {
    onDelete(event.id)
    setShowDeleteAlert(false)
    onClose()
  }

  const handleEdit = () => {
    onEdit(event)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <h2 className="tracking-tight text-xl font-semibold">
              {event.title}
            </h2>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{t('events.time')}</div>
                <div className="text-sm text-muted-foreground">
                  {format(event.start, "EEEE, d MMMM yyyy")}
                  <br />
                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{t('events.instructor')}</div>
                <div className="text-sm text-muted-foreground">
                  TA {event.instructor}
                </div>
              </div>
            </div>

            {event.materials && event.materials.length > 0 && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{t('materials.title')}</div>
                  <div className="mt-2 space-y-2">
                    {event.materials.map((material) => (
                      <a
                        key={material.id}
                        href={material.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        {material.title}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
                <Edit className="h-4 w-4" />
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
            <AlertDialogTitle>{t('common.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.deleteConfirm.description')}
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