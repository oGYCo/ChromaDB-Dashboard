"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Eye, Copy } from "lucide-react"
import { toast } from "sonner"

interface Document {
  id: string
  document: string
  metadata?: Record<string, any>
}

interface CollectionDataTableProps {
  data: Document[]
  isLoading?: boolean
  collectionName: string
  onDelete: (ids: string[]) => Promise<void>
}

export function CollectionDataTable({
  data,
  isLoading = false,
  collectionName,
  onDelete,
}: CollectionDataTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Document detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const handleDelete = async (docId: string) => {
    setSelectedDocId(docId)
    setDeleteDialogOpen(true)
  }

  const handleViewDetail = (document: Document) => {
    setSelectedDocument(document)
    setDetailDialogOpen(true)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const confirmDelete = async () => {
    if (!selectedDocId) return

    setIsDeleting(true)
    try {
      await onDelete([selectedDocId])
      toast.success("Document deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedDocId(null)
    } catch (error) {
      toast.error("Failed to delete document")
      console.error("Delete error:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents found in this collection.
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Metadata</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell 
                className="font-mono text-xs max-w-xs truncate cursor-pointer hover:bg-accent"
                onClick={() => handleViewDetail(doc)}
                title="Click to view full details"
              >
                {doc.id}
              </TableCell>
              <TableCell 
                className="max-w-md cursor-pointer hover:bg-accent"
                onClick={() => handleViewDetail(doc)}
                title="Click to view full content"
              >
                <div className="line-clamp-3 text-sm">{doc.document}</div>
              </TableCell>
              <TableCell 
                className="max-w-xs cursor-pointer hover:bg-accent"
                onClick={() => handleViewDetail(doc)}
                title="Click to view full metadata"
              >
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                  {JSON.stringify(doc.metadata || {}, null, 2)}
                </pre>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetail(doc)}
                    className="text-blue-600 hover:text-blue-700"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              Complete view of document content, metadata, and properties.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="flex-1 overflow-auto space-y-6 custom-scrollbar">
              {/* Document ID */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Document ID</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedDocument.id, "Document ID")}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">
                  {selectedDocument.id}
                </div>
              </div>

              {/* Document Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Document Content</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedDocument.document, "Document content")}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-auto custom-scrollbar">
                  {selectedDocument.document}
                </div>
              </div>

              {/* Metadata */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Metadata</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(selectedDocument.metadata || {}, null, 2), "Metadata")}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy JSON
                  </Button>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs overflow-auto max-h-40 custom-scrollbar">
                    {JSON.stringify(selectedDocument.metadata || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
