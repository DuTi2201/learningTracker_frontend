import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, FileText, User, X } from "lucide-react"
import type { Event, Material } from "@/app/[locale]/lib/mockData"
import Link from "next/link"

interface EventModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export default function EventModal({ event, isOpen, onClose }: EventModalProps) {
  if (!event) return null

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="event-modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{event.title}</span>
          </DialogTitle>
          <p id="event-modal-description" className="text-sm text-gray-500">
            Event details and associated materials.
          </p>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(event.start)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(event.start)} - {formatTime(event.end)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span>{event.instructor}</span>
          </div>
          {event.materials && event.materials.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Materials:</h4>
              {event.materials.map((material: Material, index: number) => (
                <div key={index} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>{material.title}</span>
                    <span className="text-gray-500 text-xs">{material.date}</span>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={material.link} target="_blank">
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

