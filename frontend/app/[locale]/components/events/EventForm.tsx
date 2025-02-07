"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MaterialSelector } from "./MaterialSelector"
import { useState } from "react"
import type { Event, Material } from "../../lib/mockData"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  instructor: z.string().optional(),
})

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: z.infer<typeof formSchema> & { materials: Material[] }) => void
  initialData?: z.infer<typeof formSchema> & { materials: Material[] }
}

// Mock data cho tài liệu có sẵn - trong thực tế sẽ lấy từ API
const mockExistingMaterials: Material[] = [
  {
    id: "1",
    title: "English Grammar Basics",
    description: "Basic English grammar materials",
    type: "file",
    link: "/materials/grammar-basics.pdf",
    date: "2024-01-15"
  },
  {
    id: "2",
    title: "IELTS Speaking Practice",
    description: "IELTS speaking practice materials",
    type: "file",
    link: "/materials/ielts-speaking.pdf",
    date: "2024-01-20"
  },
  {
    id: "3",
    title: "Business English Vocabulary",
    description: "Business English vocabulary list",
    type: "file",
    link: "/materials/business-vocab.pdf",
    date: "2024-01-25"
  },
]

export function EventForm({ isOpen, onClose, onSubmit, initialData }: EventFormProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>(
    initialData?.materials || []
  )
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      instructor: "",
    },
  })

  const handleClose = () => {
    form.reset()
    setSelectedMaterials([])
    onClose()
  }

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({ ...values, materials: selectedMaterials })
    form.reset()
    setSelectedMaterials([])
    onClose()
    toast({
      title: initialData ? t("events.updated") : t("events.created"),
      description: initialData ? t("events.updateSuccess") : t("events.createSuccess"),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {initialData ? t("events.edit") : t("events.addNew")}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("events.form.formDescription")}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.form.title")}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t("events.form.titlePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.form.description")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("events.form.descriptionPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("events.form.startTime")}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("events.form.endTime")}</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.form.instructor")}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t("events.form.instructorPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <MaterialSelector
              selectedMaterials={selectedMaterials}
              onSelectMaterials={setSelectedMaterials}
              existingMaterials={mockExistingMaterials}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">
                {initialData ? t("common.update") : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

