"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CollectionDataTable } from '@/components/collection-data-table'
import { MetadataFilter, FilterCondition } from '@/components/MetadataFilter'
import { useDataRefresh } from '@/contexts/data-refresh-context'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Document {
  id: string
  document: string
  metadata?: Record<string, any>
}

interface CollectionData {
  data: Document[]
  total: number
  page: number
  limit: number
}

export default function CollectionPage() {
  const params = useParams()
  const router = useRouter()
  const collectionName = decodeURIComponent(params.collectionName as string)
  const { refreshCollections } = useDataRefresh()
  
  const [data, setData] = useState<Document[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  
  // Add document dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDocument, setNewDocument] = useState('')
  const [newMetadata, setNewMetadata] = useState('{}')
  const [newDocumentId, setNewDocumentId] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  // Delete collection dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Jump to page state
  const [jumpToPage, setJumpToPage] = useState('')
  
  // Filter state
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [isFilterLoading, setIsFilterLoading] = useState(false)

  const limit = 10

  useEffect(() => {
    if (isFilterActive) {
      // Don't auto-refresh when filters are active to avoid overriding filtered results
      return
    }
    fetchCollectionData()
  }, [collectionName, currentPage, isFilterActive])

  const fetchCollectionData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionName)}?page=${currentPage}&limit=${limit}`
      )
      if (response.ok) {
        const result: CollectionData = await response.json()
        setData(result.data)
        setTotalCount(result.total)
      } else {
        toast.error('Failed to fetch collection data')
      }
    } catch (error) {
      toast.error('Failed to fetch collection data')
      console.error('Fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = async () => {
    if (filters.length === 0) {
      // No filters, fetch normal data
      setIsFilterActive(false)
      setCurrentPage(1)
      await fetchCollectionData()
      return
    }

    setIsFilterLoading(true)
    setIsFilterActive(true)
    setCurrentPage(1) // Reset to first page when applying filters
    
    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionName)}/filter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters: filters,
            page: 1,
            limit: limit
          }),
        }
      )

      if (response.ok) {
        const result: CollectionData = await response.json()
        setData(result.data)
        setTotalCount(result.total)
        toast.success(`Found ${result.total} matching documents`)
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Filter failed')
      }
    } catch (error) {
      toast.error('Filter request failed')
      console.error('Filter error:', error)
    } finally {
      setIsFilterLoading(false)
    }
  }

  const clearFilters = () => {
    setFilters([])
    setIsFilterActive(false)
    setCurrentPage(1)
    fetchCollectionData()
    toast.info('All filters cleared')
  }

  const fetchFilteredPage = async (page: number) => {
    if (!isFilterActive || filters.length === 0) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionName)}/filter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters: filters,
            page: page,
            limit: limit
          }),
        }
      )

      if (response.ok) {
        const result: CollectionData = await response.json()
        setData(result.data)
        setTotalCount(result.total)
      } else {
        toast.error('Failed to get filtered results')
      }
    } catch (error) {
      toast.error('Failed to get filtered results')
      console.error('Fetch filtered page error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDocument = async () => {
    if (!newDocument.trim()) {
      toast.error('Document content is required')
      return
    }

    let metadata
    try {
      metadata = JSON.parse(newMetadata)
    } catch (error) {
      toast.error('Invalid JSON in metadata field')
      return
    }

    setIsAdding(true)
    try {
      const payload: any = {
        documents: [newDocument.trim()],
        metadatas: [metadata],
      }
      
      if (newDocumentId.trim()) {
        payload.ids = [newDocumentId.trim()]
      }

      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionName)}/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (response.ok) {
        toast.success('Document added successfully')
        setNewDocument('')
        setNewMetadata('{}')
        setNewDocumentId('')
        setIsAddDialogOpen(false)
        await fetchCollectionData()
        // 触发侧边栏集合列表刷新（更新文档数量）
        refreshCollections()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to add document')
      }
    } catch (error) {
      toast.error('Failed to add document')
      console.error('Add document error:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteDocument = async (ids: string[]) => {
    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionName)}/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids }),
        }
      )

      if (response.ok) {
        // 乐观更新：立即从本地状态中移除已删除的文档
        setData(prevData => prevData.filter(doc => !ids.includes(doc.id)))
        setTotalCount(prevTotal => prevTotal - ids.length)
        
        // 触发侧边栏集合列表刷新（更新文档数量）
        refreshCollections()
        
        // 检查是否需要调整当前页面（如果当前页面没有数据了）
        const remainingItemsOnCurrentPage = data.filter(doc => !ids.includes(doc.id)).length
        if (remainingItemsOnCurrentPage === 0 && currentPage > 1) {
          setCurrentPage(prev => prev - 1)
        } else if (remainingItemsOnCurrentPage === 0 && currentPage === 1) {
          // 如果是第一页且没有剩余数据，重新获取数据
          await fetchCollectionData()
        }
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      throw error
    }
  }

  const handleDeleteCollection = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionName)}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('Collection deleted successfully')
        // 触发侧边栏集合列表刷新
        refreshCollections()
        router.push('/')
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to delete collection')
      }
    } catch (error) {
      toast.error('Failed to delete collection')
      console.error('Delete collection error:', error)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const clearFilter = () => {
    setCurrentPage(1)
    fetchCollectionData()
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    if (isFilterActive) {
      fetchFilteredPage(newPage)
    } else {
      // Normal pagination will be handled by useEffect
    }
  }

  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPage)
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      handlePageChange(pageNumber)
      setJumpToPage('')
    }
  }

  const handleJumpInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage()
    }
  }

  const totalPages = Math.ceil(totalCount / limit)

  // 分页组件
  const PaginationControls = () => (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} documents
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1 ml-2">
          <span className="text-sm text-muted-foreground">Go to:</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyPress={handleJumpInputKeyPress}
            placeholder="Page"
            className="w-16 h-8 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleJumpToPage}
            disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{collectionName}</h1>
            <p className="text-muted-foreground">
              {totalCount} documents
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Document</DialogTitle>
                  <DialogDescription>
                    Add a new document to the {collectionName} collection.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="document-id">Document ID (optional)</Label>
                    <Input
                      id="document-id"
                      value={newDocumentId}
                      onChange={(e) => setNewDocumentId(e.target.value)}
                      placeholder="Leave empty for auto-generated ID"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="document-content">Document Content *</Label>
                    <Textarea
                      id="document-content"
                      value={newDocument}
                      onChange={(e) => setNewDocument(e.target.value)}
                      placeholder="Enter document content..."
                      className="min-h-32"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="metadata">Metadata (JSON)</Label>
                    <Textarea
                      id="metadata"
                      value={newMetadata}
                      onChange={(e) => setNewMetadata(e.target.value)}
                      placeholder='{"key": "value"}'
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isAdding}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddDocument} disabled={isAdding}>
                    {isAdding ? 'Adding...' : 'Add Document'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Collection</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the &quot;{collectionName}&quot; collection? 
                    This will permanently delete all documents in this collection. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteCollection}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Collection'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Metadata Filter */}
        <div className="mt-4">
          <MetadataFilter
            filters={filters}
            onFiltersChange={setFilters}
            onApplyFilters={applyFilters}
            onClearFilters={clearFilters}
            isLoading={isFilterLoading}
          />
        </div>
        
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Filter Status */}
        {isFilterActive && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              Showing filtered results ({totalCount} matching documents)
              <Button
                variant="link"
                size="sm"
                onClick={clearFilters}
                className="ml-2 h-auto p-0 text-blue-600 underline"
              >
                Clear filters
              </Button>
            </p>
          </div>
        )}
        
        {/* Top Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="mb-4">
            <PaginationControls />
          </div>
        )}
        
        <CollectionDataTable
          data={data}
          isLoading={isLoading}
          collectionName={collectionName}
          onDelete={handleDeleteDocument}
        />
        
        {/* Bottom Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6">
            <PaginationControls />
          </div>
        )}
      </div>
    </div>
  )
}
