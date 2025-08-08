"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Database, Plus, Moon, Sun, Wifi, WifiOff, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useDataRefresh } from '@/contexts/data-refresh-context'
import { toast } from 'sonner'

interface Collection {
  name: string
  count: number
}

interface HealthStatus {
  status: string
  message?: string
}

export default function Sidebar() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Connection configuration states
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [chromaHost, setChromaHost] = useState('localhost')
  const [chromaPort, setChromaPort] = useState('8001')
  const [isConnecting, setIsConnecting] = useState(false)
  
  const { theme, setTheme } = useTheme()
  const { onCollectionsRefresh } = useDataRefresh()

  useEffect(() => {
    fetchData()
    // Poll every 30 seconds for health status
    const interval = setInterval(() => {
      fetchHealthStatus()
    }, 30000)
    
    // 监听集合列表刷新事件
    const unsubscribe = onCollectionsRefresh(() => {
      fetchCollections()
    })
    
    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [onCollectionsRefresh])

  // Load saved connection configuration
  useEffect(() => {
    const savedHost = localStorage.getItem('chromadb-host')
    const savedPort = localStorage.getItem('chromadb-port')
    if (savedHost) setChromaHost(savedHost)
    if (savedPort) setChromaPort(savedPort)
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchCollections(), fetchHealthStatus()])
    setIsLoading(false)
  }

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data)
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error)
    }
  }

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        setHealthStatus(data)
      } else {
        setHealthStatus({ status: 'error', message: 'Failed to connect' })
      }
    } catch (error) {
      setHealthStatus({ status: 'error', message: 'Connection failed' })
    }
  }

  const createCollection = async () => {
    if (!newCollectionName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      })

      if (response.ok) {
        toast.success('Collection created successfully')
        setNewCollectionName('')
        setIsCreateDialogOpen(false)
        await fetchCollections()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to create collection')
      }
    } catch (error) {
      toast.error('Failed to create collection')
      console.error('Create collection error:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const saveConnectionConfig = () => {
    localStorage.setItem('chromadb-host', chromaHost)
    localStorage.setItem('chromadb-port', chromaPort)
    toast.success('Connection configuration saved')
  }

  const testConnection = async () => {
    setIsConnecting(true)
    try {
      // Create a test endpoint URL with the configured host and port
      const testUrl = `/api/test-connection?host=${encodeURIComponent(chromaHost)}&port=${encodeURIComponent(chromaPort)}`
      const response = await fetch(testUrl)
      
      if (response.ok) {
        const data = await response.json()
        setHealthStatus({ status: 'ok', message: `Connected to ${chromaHost}:${chromaPort}` })
        toast.success('Connection successful!')
        setIsConfigDialogOpen(false)
        saveConnectionConfig()
        // Refresh data with new connection
        fetchData()
      } else {
        const error = await response.json()
        setHealthStatus({ status: 'error', message: error.detail || 'Connection failed' })
        toast.error('Connection failed: ' + (error.detail || 'Unknown error'))
      }
    } catch (error) {
      setHealthStatus({ status: 'error', message: 'Connection failed' })
      toast.error('Connection failed: Network error')
    } finally {
      setIsConnecting(false)
    }
  }

  const resetToDefault = () => {
    setChromaHost('localhost')
    setChromaPort('8001')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            ChromaDB Dashboard
          </h1>
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {healthStatus?.status === 'ok' ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    Disconnected
                  </>
                )}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsConfigDialogOpen(true)}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {healthStatus?.message || 'Status unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Collections ({collections.length})</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-3 w-3" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogDescription>
                  Enter a name for your new ChromaDB collection.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="collection-name">Collection Name</Label>
                  <Input
                    id="collection-name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Enter collection name..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        createCollection()
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createCollection}
                  disabled={!newCollectionName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {collections.map((collection) => (
            <Link
              key={collection.name}
              href={`/collections/${encodeURIComponent(collection.name)}`}
              className="block"
            >
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{collection.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {collection.count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          {collections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No collections found. Create your first collection to get started.
            </div>
          )}
        </div>
      </div>

      {/* Connection Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ChromaDB Connection Settings</DialogTitle>
            <DialogDescription>
              Configure the host and port for your ChromaDB server connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={chromaHost}
                onChange={(e) => setChromaHost(e.target.value)}
                placeholder="localhost"
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                value={chromaPort}
                onChange={(e) => setChromaPort(e.target.value)}
                placeholder="8001"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Current: {chromaHost}:{chromaPort}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetToDefault}
              disabled={isConnecting}
            >
              Reset to Default
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsConfigDialogOpen(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
            <Button
              onClick={testConnection}
              disabled={isConnecting || !chromaHost.trim() || !chromaPort.trim()}
            >
              {isConnecting ? 'Testing...' : 'Test & Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
