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
import { MaterialSelector } from "../../components/shared/MaterialSelector"
import { useState, useEffect } from "react"
import type { Event, Material } from "../../lib/types"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { getMaterials } from "../../lib/api"

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

export function EventForm({ isOpen, onClose, onSubmit, initialData }: EventFormProps) {
  const t = useTranslations()
  const { toast } = useToast()
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([])
  const [existingMaterials, setExistingMaterials] = useState<Material[]>([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      instructor: "",
    },
  })

  // Cập nhật form khi có initialData thay đổi
  useEffect(() => {
    if (initialData) {
      console.log('Setting form values from initialData:', initialData);
      form.reset({
        title: initialData.title || '',
        description: initialData.description || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        instructor: initialData.instructor || '',
      });
      setSelectedMaterials(initialData.materials || []);
    } else {
      form.reset({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        instructor: "",
      });
      setSelectedMaterials([]);
    }
  }, [initialData, form]);

  // Load materials khi form mở
  useEffect(() => {
    if (isOpen) {
      loadMaterials()
    }
  }, [isOpen])

  const loadMaterials = async () => {
    try {
      setIsLoadingMaterials(true)
      const data = await getMaterials()
      setExistingMaterials(data)
    } catch (error) {
      console.error('Failed to load materials:', error)
      toast({
        title: t('materials.error.load'),
        description: t('materials.error.loadDescription'),
        variant: "destructive",
      })
    } finally {
      setIsLoadingMaterials(false)
    }
  }

  const handleClose = () => {
    form.reset();
    setSelectedMaterials([]);
    onClose();
  }

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      console.log('Form values:', values);

      // Kiểm tra các trường bắt buộc
      if (!values.title?.trim()) {
        toast({
          title: t('events.error.missingFields'),
          description: t('events.error.titleRequired'),
          variant: "destructive",
        });
        return;
      }

      if (!values.startTime) {
        toast({
          title: t('events.error.missingFields'),
          description: t('events.error.startTimeRequired'),
          variant: "destructive",
        });
        return;
      }

      if (!values.endTime) {
        toast({
          title: t('events.error.missingFields'),
          description: t('events.error.endTimeRequired'),
          variant: "destructive",
        });
        return;
      }

      // Validate thời gian
      const startTime = new Date(values.startTime);
      const endTime = new Date(values.endTime);
      
      if (isNaN(startTime.getTime())) {
        toast({
          title: t('events.error.invalidTime'),
          description: t('events.error.invalidStartTime'),
          variant: "destructive",
        });
        return;
      }

      if (isNaN(endTime.getTime())) {
        toast({
          title: t('events.error.invalidTime'),
          description: t('events.error.invalidEndTime'),
          variant: "destructive",
        });
        return;
      }
      
      if (endTime <= startTime) {
        toast({
          title: t('events.error.invalidTime'),
          description: t('events.error.endTimeBeforeStart'),
          variant: "destructive",
        });
        return;
      }

      // Chuẩn bị dữ liệu form
      const formData = {
        title: values.title.trim(),
        description: values.description?.trim() || "",
        startTime: values.startTime,
        endTime: values.endTime,
        instructor: values.instructor?.trim() || "",
        materials: selectedMaterials
      };

      console.log('Submitting form data:', formData);
      onSubmit(formData);

      // Reset form và đóng modal
      handleClose();
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: t('events.error.create'),
        description: error instanceof Error ? error.message : t('events.error.createDescription'),
        variant: "destructive",
      });
    }
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
              existingMaterials={existingMaterials}
              isLoading={isLoadingMaterials}
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

