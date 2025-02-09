import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../lib/api'
import type { Material } from '../lib/types'

export function useMaterials() {
  const queryClient = useQueryClient()

  // Query để lấy danh sách materials
  const { data: materials = [], isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: getMaterials,
  })

  // Mutation để tạo material mới
  const createMaterialMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: (newMaterial) => {
      // Cập nhật cache sau khi tạo thành công
      queryClient.setQueryData(['materials'], (old: Material[] = []) => [...old, newMaterial])
    },
  })

  // Mutation để cập nhật material
  const updateMaterialMutation = useMutation({
    mutationFn: (material: Material) => updateMaterial(material.id, material),
    onSuccess: (updatedMaterial) => {
      // Cập nhật cache sau khi sửa thành công
      queryClient.setQueryData(['materials'], (old: Material[] = []) => 
        old.map(m => m.id === updatedMaterial.id ? updatedMaterial : m)
      )
    },
  })

  // Mutation để xóa material
  const deleteMaterialMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: (_, deletedId) => {
      // Cập nhật cache sau khi xóa thành công
      queryClient.setQueryData(['materials'], (old: Material[] = []) => 
        old.filter(m => m.id !== deletedId)
      )
    },
  })

  return {
    materials,
    isLoading,
    error,
    createMaterial: createMaterialMutation.mutate,
    updateMaterial: updateMaterialMutation.mutate,
    deleteMaterial: deleteMaterialMutation.mutate,
    isCreating: createMaterialMutation.isPending,
    isUpdating: updateMaterialMutation.isPending,
    isDeleting: deleteMaterialMutation.isPending,
  }
} 