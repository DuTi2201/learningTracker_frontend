import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Upload, FileText, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getMaterials, createMaterial, uploadFile } from "../../lib/api"

// Định nghĩa interface Material để không phụ thuộc vào mockData
export interface Material {
  id: string
  title: string
  description?: string
  type: "file" | "link"
  link: string
  date: string
}

interface MaterialSelectorProps {
  selectedMaterials: Material[]
  onSelectMaterials: (materials: Material[]) => void
  existingMaterials?: Material[]
  labelText?: string // Thêm prop để tùy chỉnh label text
  isLoading?: boolean
}

export function MaterialSelector({
  selectedMaterials,
  onSelectMaterials,
  existingMaterials: propExistingMaterials,
  labelText = "Materials",
  isLoading = false
}: MaterialSelectorProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({})
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [tempSelectedMaterials, setTempSelectedMaterials] = useState<Material[]>([])
  const [materials, setMaterials] = useState<Material[]>([])

  useEffect(() => {
    if (isOpen) {
      loadMaterials()
    }
  }, [isOpen])

  const loadMaterials = async () => {
    try {
      const data = await getMaterials()
      setMaterials(data)
    } catch (error) {
      toast.error(t("materials.error.load"), {
        description: t("materials.error.loadDescription")
      })
    }
  }

  const handleOpenDialog = () => {
    setTempSelectedMaterials([...selectedMaterials])
    setIsOpen(true)
  }

  const handleCloseDialog = () => {
    setTempSelectedMaterials([])
    setNewMaterial({})
    setUploadedFile(null)
    setIsOpen(false)
  }

  const handleSaveSelections = () => {
    onSelectMaterials(tempSelectedMaterials)
    toast.success(t("materials.selectionSaved"), {
      description: t("materials.selectionSavedDescription"),
    })
    handleCloseDialog()
  }

  const handleSelectMaterial = (material: Material) => {
    const isSelected = tempSelectedMaterials.some((m) => m.id === material.id)
    if (isSelected) {
      setTempSelectedMaterials(tempSelectedMaterials.filter((m) => m.id !== material.id))
    } else {
      setTempSelectedMaterials([...tempSelectedMaterials, material])
    }
  }

  const handleUploadMaterial = async () => {
    if (!newMaterial.title || !uploadedFile) return

    try {
      // Hiển thị loading state
      toast.loading(t("materials.uploading"), {
        id: "upload-loading"
      })

      // Upload file lên server
      const uploadResult = await uploadFile(uploadedFile)

      // Tạo material mới với URL từ server
      const newItem = {
        title: newMaterial.title,
        description: newMaterial.description || "",
        type: "file" as const,
        link: uploadResult.fileUrl,
        date: new Date().toISOString().split('T')[0]
      }

      const createdMaterial = await createMaterial(newItem)
      setMaterials([...materials, createdMaterial])
      setTempSelectedMaterials([...tempSelectedMaterials, createdMaterial])
      setNewMaterial({})
      setUploadedFile(null)
      
      // Cập nhật toast thành công
      toast.success(t("materials.uploaded"), {
        description: t("materials.uploadSuccess"),
        id: "upload-loading"
      })
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(t("materials.error.upload"), {
        description: t("materials.error.uploadDescription"),
        id: "upload-loading"
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{labelText}</Label>
        <Button type="button" onClick={handleOpenDialog}>
          {t("materials.select")}
        </Button>
      </div>

      {selectedMaterials.length > 0 && (
        <div className="space-y-2">
          {selectedMaterials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{material.title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newSelectedMaterials = selectedMaterials.filter(m => m.id !== material.id);
                  onSelectMaterials(newSelectedMaterials);
                  setTempSelectedMaterials(newSelectedMaterials);
                  toast.success(t("materials.deleted"), {
                    description: t("materials.deleteSuccess"),
                  });
                }}
              >
                {t("common.delete")}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{t("materials.selectTitle")}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseDialog}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="existing">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">{t("materials.existing")}</TabsTrigger>
              <TabsTrigger value="upload">{t("materials.upload")}</TabsTrigger>
            </TabsList>

            <TabsContent value="existing">
              <ScrollArea className="h-[300px] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials.map((material) => {
                      const isSelected = tempSelectedMaterials.some(
                        (m) => m.id === material.id
                      )
                      return (
                        <div
                          key={material.id}
                          className={cn(
                            "flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent",
                            isSelected && "border-primary"
                          )}
                          onClick={() => handleSelectMaterial(material)}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="font-medium">{material.title}</span>
                              {material.description && (
                                <span className="text-sm text-muted-foreground">
                                  {material.description}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("materials.name")}</Label>
                  <Input
                    placeholder={t("materials.namePlaceholder")}
                    value={newMaterial.title || ""}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("materials.description")}</Label>
                  <Input
                    placeholder={t("materials.descriptionPlaceholder")}
                    value={newMaterial.description || ""}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("materials.file")}</Label>
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-accent",
                      "transition-colors duration-200"
                    )}
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile ? uploadedFile.name : t("materials.dropzone")}
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={!newMaterial.title || !uploadedFile}
                  onClick={handleUploadMaterial}
                >
                  {t("materials.uploadAndSelect")}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveSelections}>
              {t("materials.saveSelections")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 