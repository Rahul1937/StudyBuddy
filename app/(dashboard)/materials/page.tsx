'use client'

import { useState, useEffect } from 'react'
import { useModal } from '@/contexts/ModalContext'
import { format } from 'date-fns'

interface Folder {
  id: string
  name: string
  parentId: string | null
  children: Folder[]
  materials: StudyMaterial[]
  createdAt: string
}

interface StudyMaterial {
  id: string
  title: string
  type: 'file' | 'url'
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  url: string | null
  description: string | null
  folderId: string | null
  createdAt: string
}

export default function MaterialsPage() {
  const { showConfirm, showAlert } = useModal()
  const [folders, setFolders] = useState<Folder[]>([])
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [folderPath, setFolderPath] = useState<Folder[]>([])
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newMaterialTitle, setNewMaterialTitle] = useState('')
  const [newMaterialUrl, setNewMaterialUrl] = useState('')
  const [newMaterialDescription, setNewMaterialDescription] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [materialType, setMaterialType] = useState<'file' | 'url'>('file')

  useEffect(() => {
    fetchFolders()
    fetchMaterials()
  }, [currentFolderId])

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/folders?parentId=${currentFolderId || ''}`)
      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`/api/materials?folderId=${currentFolderId || ''}`)
      const data = await response.json()
      setMaterials(data.materials || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllFolders = async () => {
    try {
      const response = await fetch('/api/folders')
      const data = await response.json()
      return data.folders || []
    } catch (error) {
      console.error('Error fetching all folders:', error)
      return []
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      await showAlert({ title: 'Error', message: 'Folder name is required' })
      return
    }

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolderId,
        }),
      })

      if (response.ok) {
        setNewFolderName('')
        setShowCreateFolder(false)
        fetchFolders()
      } else {
        const error = await response.json()
        await showAlert({ title: 'Error', message: error.error || 'Failed to create folder' })
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      await showAlert({ title: 'Error', message: 'Failed to create folder' })
    }
  }

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folderName}"? This will also delete all subfolders and materials inside.`,
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (currentFolderId === folderId) {
          navigateToFolder(folderPath.length > 1 ? folderPath[folderPath.length - 2].id : null)
        }
        fetchFolders()
        fetchMaterials()
      } else {
        await showAlert({ title: 'Error', message: 'Failed to delete folder' })
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      await showAlert({ title: 'Error', message: 'Failed to delete folder' })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadData = await uploadResponse.json()

      const materialResponse = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMaterialTitle.trim() || file.name,
          type: 'file',
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
          description: newMaterialDescription.trim() || null,
          folderId: currentFolderId,
        }),
      })

      if (materialResponse.ok) {
        setNewMaterialTitle('')
        setNewMaterialDescription('')
        setShowAddMaterial(false)
        fetchMaterials()
        await showAlert({ title: 'Success', message: 'File uploaded successfully', type: 'success' })
      } else {
        throw new Error('Failed to save material')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      await showAlert({ title: 'Error', message: 'Failed to upload file' })
    } finally {
      setUploadingFile(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleAddUrl = async () => {
    if (!newMaterialTitle.trim()) {
      await showAlert({ title: 'Error', message: 'Title is required' })
      return
    }

    if (!newMaterialUrl.trim()) {
      await showAlert({ title: 'Error', message: 'URL is required' })
      return
    }

    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMaterialTitle.trim(),
          type: 'url',
          url: newMaterialUrl.trim(),
          description: newMaterialDescription.trim() || null,
          folderId: currentFolderId,
        }),
      })

      if (response.ok) {
        setNewMaterialTitle('')
        setNewMaterialUrl('')
        setNewMaterialDescription('')
        setShowAddMaterial(false)
        fetchMaterials()
        await showAlert({ title: 'Success', message: 'URL saved successfully', type: 'success' })
      } else {
        const error = await response.json()
        await showAlert({ title: 'Error', message: error.error || 'Failed to save URL' })
      }
    } catch (error) {
      console.error('Error adding URL:', error)
      await showAlert({ title: 'Error', message: 'Failed to save URL' })
    }
  }

  const handleDeleteMaterial = async (materialId: string, materialTitle: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Material',
      message: `Are you sure you want to delete "${materialTitle}"?`,
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchMaterials()
      } else {
        await showAlert({ title: 'Error', message: 'Failed to delete material' })
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      await showAlert({ title: 'Error', message: 'Failed to delete material' })
    }
  }

  const navigateToFolder = async (folderId: string | null) => {
    setCurrentFolderId(folderId)
    
    // Build folder path
    if (folderId) {
      const allFolders = await fetchAllFolders()
      const buildPath = (id: string | null, path: Folder[] = []): Folder[] => {
        if (!id) return path
        const folder = allFolders.find((f: Folder) => f.id === id)
        if (!folder) return path
        return buildPath(folder.parentId, [folder, ...path])
      }
      setFolderPath(buildPath(folderId))
    } else {
      setFolderPath([])
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Study Materials
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Organize your study files and resources</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-semibold"
          >
            + New Folder
          </button>
          <button
            onClick={() => setShowAddMaterial(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold"
          >
            + Add Material
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {folderPath.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigateToFolder(null)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Home
          </button>
          {folderPath.map((folder, index) => (
            <span key={folder.id} className="flex items-center gap-2">
              <span className="text-slate-400">/</span>
              <button
                onClick={() => navigateToFolder(folder.id)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-32 mb-2 animate-pulse" />
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-24 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Folders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => navigateToFolder(folder.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-3xl">📁</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{folder.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {folder.children.length} subfolder{folder.children.length !== 1 ? 's' : ''}, {folder.materials.length} item{folder.materials.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFolder(folder.id, folder.name)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        title="Delete folder"
                      >
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {materials.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Materials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">
                          {material.type === 'file' ? '📄' : '🔗'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{material.title}</h3>
                          {material.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {material.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMaterial(material.id, material.title)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex-shrink-0"
                        title="Delete material"
                      >
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      {material.type === 'file' ? (
                        <a
                          href={material.fileUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {material.fileName} ({formatFileSize(material.fileSize)})
                        </a>
                      ) : (
                        <a
                          href={material.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium truncate flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {material.url}
                        </a>
                      )}
                      <span className="text-xs text-slate-400 ml-2">
                        {format(new Date(material.createdAt), 'MMM d')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {folders.length === 0 && materials.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 mb-2">No folders or materials yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Create a folder or add a material to get started</p>
            </div>
          )}
        </>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Create New Folder</h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateFolder(false)
                  setNewFolderName('')
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Add Material</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newMaterialTitle}
                  onChange={(e) => setNewMaterialTitle(e.target.value)}
                  placeholder="Material title"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
                <div className="flex gap-2">
                  <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    materialType === 'file' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                  }`}>
                    <input 
                      type="radio" 
                      name="materialType" 
                      value="file" 
                      className="mr-2" 
                      checked={materialType === 'file'}
                      onChange={() => setMaterialType('file')}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload File</span>
                  </label>
                  <label className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    materialType === 'url' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                  }`}>
                    <input 
                      type="radio" 
                      name="materialType" 
                      value="url" 
                      className="mr-2"
                      checked={materialType === 'url'}
                      onChange={() => setMaterialType('url')}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Add URL</span>
                  </label>
                </div>
              </div>
              {materialType === 'file' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">File</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {uploadingFile && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Uploading...</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">URL</label>
                  <input
                    type="url"
                    value={newMaterialUrl}
                    onChange={(e) => setNewMaterialUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description (optional)</label>
                <textarea
                  value={newMaterialDescription}
                  onChange={(e) => setNewMaterialDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowAddMaterial(false)
                  setNewMaterialTitle('')
                  setNewMaterialUrl('')
                  setNewMaterialDescription('')
                  setMaterialType('file')
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (materialType === 'url') {
                    handleAddUrl()
                  }
                }}
                disabled={materialType === 'file'}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

