"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { materials as initialMaterials } from "../../lib/mockData"
import type { Material } from "../../lib/mockData"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { useTranslations } from 'next-intl'

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null)
  const { toast } = useToast()
  const t = useTranslations()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMaterial.title || !uploadedFile) {
      toast({
        title: t('materials.validation.required'),
        description: t('materials.validation.titleFileRequired'),
        variant: "destructive",
      })
      return
    }

    // Trong thực tế, bạn sẽ upload file lên server và nhận về URL
    const fileUrl = URL.createObjectURL(uploadedFile)

    const newItem: Material = {
      id: String(Math.max(...materials.map((m) => Number(m.id))) + 1),
      title: newMaterial.title,
      description: newMaterial.description,
      type: "file",
      link: fileUrl,
    }

    setMaterials([...materials, newItem])
    setNewMaterial({ title: "", description: "" })
    setUploadedFile(null)
    toast({
      title: t('materials.uploaded'),
      description: t('materials.uploadSuccess'),
    })
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMaterial) return

    const updatedMaterials = materials.map((material) =>
      material.id === editingMaterial.id ? editingMaterial : material
    )

    setMaterials(updatedMaterials)
    setEditingMaterial(null)
    toast({
      title: t('materials.updated'),
      description: t('materials.updateSuccess'),
    })
  }

  const handleDelete = (material: Material) => {
    setMaterialToDelete(material)
    setShowDeleteAlert(true)
  }

  const confirmDelete = () => {
    if (!materialToDelete) return

    setMaterials(materials.filter((m) => m.id !== materialToDelete.id))
    setShowDeleteAlert(false)
    setMaterialToDelete(null)
    toast({
      title: t('materials.deleted'),
      description: t('materials.deleteSuccess'),
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Danh sách tài liệu */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('materials.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">{material.title}</h3>
                      {material.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {material.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={material.link} target="_blank" rel="noopener noreferrer">
                        {t('materials.view')}
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(material)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="ml-2">{t('common.edit')}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(material)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-2">{t('common.delete')}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Form thêm tài liệu mới */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('materials.addNew')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('materials.name')}</Label>
                  <Input
                    id="title"
                    value={newMaterial.title}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, title: e.target.value })
                    }
                    placeholder={t('materials.namePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('materials.description')}</Label>
                  <Input
                    id="description"
                    value={newMaterial.description}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, description: e.target.value })
                    }
                    placeholder={t('materials.descriptionPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('materials.file')}</Label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile ? uploadedFile.name : t('materials.dropzone')}
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {t('materials.addNew')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog chỉnh sửa tài liệu */}
      <Dialog open={!!editingMaterial} onOpenChange={() => setEditingMaterial(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('materials.edit')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('materials.name')}</Label>
              <Input
                id="edit-title"
                value={editingMaterial?.title || ""}
                onChange={(e) =>
                  setEditingMaterial(
                    editingMaterial
                      ? { ...editingMaterial, title: e.target.value }
                      : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('materials.description')}</Label>
              <Input
                id="edit-description"
                value={editingMaterial?.description || ""}
                onChange={(e) =>
                  setEditingMaterial(
                    editingMaterial
                      ? { ...editingMaterial, description: e.target.value }
                      : null
                  )
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingMaterial(null)}>
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
            <AlertDialogTitle>{t('common.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.deleteConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMaterialToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

