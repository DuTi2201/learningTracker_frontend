import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Upload, FileText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Material } from "../../lib/mockData"

interface MaterialSelectorProps {
  selectedMaterials: Material[]
  onSelectMaterials: (materials: Material[]) => void
  existingMaterials?: Material[]
}

export function MaterialSelector({
  selectedMaterials,
  onSelectMaterials,
  existingMaterials = [],
}: MaterialSelectorProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({})
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [tempSelectedMaterials, setTempSelectedMaterials] = useState<Material[]>([])

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

  const handleUploadMaterial = () => {
    if (!newMaterial.title || !uploadedFile) return

    const newMaterialComplete: Material = {
      id: String(Math.max(...existingMaterials.map((m) => Number(m.id)), 0) + 1),
      title: newMaterial.title,
      description: newMaterial.description || "",
      type: "file",
      link: URL.createObjectURL(uploadedFile),
      date: new Date().toISOString().split('T')[0]
    }

    setTempSelectedMaterials([...tempSelectedMaterials, newMaterialComplete])
    setNewMaterial({})
    setUploadedFile(null)
    
    toast.success(t("materials.uploaded"), {
      description: t("materials.uploadSuccess"),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{t("assignments.materials")}</Label>
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
                onClick={() => handleSelectMaterial(material)}
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
            <DialogTitle>{t("materials.selectTitle")}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="existing">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">{t("materials.existing")}</TabsTrigger>
              <TabsTrigger value="upload">{t("materials.upload")}</TabsTrigger>
            </TabsList>

            <TabsContent value="existing">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {existingMaterials.map((material) => {
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