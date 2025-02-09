"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Pencil, Trash2, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, uploadFile } from "../../lib/api"
import type { Material } from "../../lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
import { useMaterials } from '../../hooks/useMaterials'

// Tách phần hiển thị danh sách tài liệu thành component riêng
function MaterialsList({ materials, onEdit, onDelete, onView }: {
  materials: Material[]
  onEdit: (material: Material) => void
  onDelete: (material: Material) => void
  onView: (material: Material) => void
}) {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (material.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || material.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder={t('materials.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 bg-background"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">{t('materials.filters.all')}</option>
          <option value="file">{t('materials.filters.files')}</option>
          <option value="link">{t('materials.filters.links')}</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/40 transition-colors"
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
                {material.type === 'file' ? (
                  <FileText className="h-5 w-5 text-primary" />
                ) : (
                  <ExternalLink className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{material.title}</h3>
                {material.description && material.description.length > 0 && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{material.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(material.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(material)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(material)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(material)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('materials.noResults')}</p>
          </div>
        )}
      </div>
    </>
  )
}

export default function Materials() {
  const {
    materials,
    isLoading,
    createMaterial: createMaterialMutation,
    updateMaterial: updateMaterialMutation,
    deleteMaterial: deleteMaterialMutation,
    isCreating,
    isUpdating,
    isDeleting
  } = useMaterials()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    description: "",
    type: "file",
    link: "",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const { toast } = useToast()
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMaterial.title || !uploadedFile) {
      toast({
        title: t('materials.validation.required'),
        description: t('materials.validation.titleLinkRequired'),
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: t("materials.uploading"),
        description: t("materials.uploadDescription"),
      })

      // Tạo FormData để gửi file
      const formData = new FormData()
      formData.append('file', uploadedFile)

      // Upload file lên server
      const uploadResult = await fetch('http://localhost:5001/api/upload', {
        method: 'POST',
        body: formData
      }).then(res => {
        if (!res.ok) throw new Error('Failed to upload file')
        return res.json()
      })

      // Tạo material mới với URL từ server
      const newItem = {
        title: newMaterial.title,
        description: newMaterial.description || "",
        type: "file",
        link: `http://localhost:5001${uploadResult.fileUrl}`,
        date: new Date().toISOString().split('T')[0],
      }

      await createMaterialMutation(newItem)
      setNewMaterial({
        title: "",
        description: "",
        type: "file",
        link: "",
      })
      setUploadedFile(null)
      setIsDialogOpen(false)
      
      toast({
        title: t('materials.created'),
        description: t('materials.createSuccess'),
      })
    } catch (error) {
      console.error('Error creating material:', error)
      toast({
        title: t('materials.error.create'),
        description: t('materials.error.createDescription'),
        variant: "destructive"
      })
    }
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
  }

  const handleUpdate = async () => {
    if (!editingMaterial) return

    try {
      await updateMaterialMutation(editingMaterial)
      setEditingMaterial(null)
      toast({
        title: t('materials.updated'),
        description: t('materials.updateSuccess'),
      })
    } catch (error) {
      toast({
        title: t('materials.error.update'),
        description: t('materials.error.updateDescription'),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!materialToDelete) return

    try {
      await deleteMaterialMutation(materialToDelete.id)
      setMaterialToDelete(null)
      setShowDeleteAlert(false)
      toast({
        title: t('materials.deleted'),
        description: t('materials.deleteSuccess'),
      })
    } catch (error) {
      toast({
        title: t('materials.error.delete'),
        description: t('materials.error.deleteDescription'),
        variant: "destructive",
      })
    }
  }

  const handleView = (material: Material) => {
    setSelectedMaterial(material)
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('materials.title')}</h1>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          disabled={isCreating}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isCreating ? t('materials.uploading') : t('materials.upload')}
        </Button>
      </div>

      <Suspense fallback={<div className="text-center py-8">
        <p className="text-muted-foreground">{t('materials.loading')}</p>
      </div>}>
        {!isLoading && (
          <MaterialsList
            materials={materials}
            onEdit={handleEdit}
            onDelete={(material) => {
              setMaterialToDelete(material)
              setShowDeleteAlert(true)
            }}
            onView={handleView}
          />
        )}
      </Suspense>

      {/* Dialog xem tài liệu */}
      <Dialog open={selectedMaterial !== null} onOpenChange={() => setSelectedMaterial(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedMaterial?.title}</DialogTitle>
            <DialogDescription>{selectedMaterial?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 relative">
            {selectedMaterial?.type === 'file' && selectedMaterial.link.endsWith('.pdf') ? (
              <iframe
                src={`${selectedMaterial.link}#toolbar=0`}
                className="w-full h-full"
                style={{ minHeight: '60vh' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Button
                  onClick={() => window.open(selectedMaterial?.link, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('materials.openInNewTab')}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog thêm tài liệu mới */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('materials.addNew')}</DialogTitle>
            <DialogDescription>{t('materials.addNewDescription')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('materials.name')}</Label>
              <Input
                value={newMaterial.title}
                onChange={(e) =>
                  setNewMaterial({ ...newMaterial, title: e.target.value })
                }
                placeholder={t('materials.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('materials.description')}</Label>
              <Input
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
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              {t('materials.addNew')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa tài liệu */}
      <Dialog open={editingMaterial !== null} onOpenChange={() => setEditingMaterial(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('materials.edit')}</DialogTitle>
            <DialogDescription>{t('materials.editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('materials.name')}</Label>
              <Input
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
              <Label>{t('materials.description')}</Label>
              <Input
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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingMaterial(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdate}>{t('common.update')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert dialog xóa tài liệu */}
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
            <AlertDialogAction onClick={handleDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

