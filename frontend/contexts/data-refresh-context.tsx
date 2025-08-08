"use client"

import { createContext, useContext, useCallback, useState } from 'react'

interface DataRefreshContextType {
  // 触发集合列表刷新
  refreshCollections: () => void
  // 触发特定集合数据刷新
  refreshCollection: (collectionName: string) => void
  // 订阅集合列表刷新事件
  onCollectionsRefresh: (callback: () => void) => () => void
  // 订阅特定集合数据刷新事件
  onCollectionRefresh: (collectionName: string, callback: () => void) => () => void
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined)

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const [collectionsRefreshCallbacks, setCollectionsRefreshCallbacks] = useState<Set<() => void>>(new Set())
  const [collectionRefreshCallbacks, setCollectionRefreshCallbacks] = useState<Map<string, Set<() => void>>>(new Map())

  const refreshCollections = useCallback(() => {
    collectionsRefreshCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in collections refresh callback:', error)
      }
    })
  }, [collectionsRefreshCallbacks])

  const refreshCollection = useCallback((collectionName: string) => {
    const callbacks = collectionRefreshCallbacks.get(collectionName)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error(`Error in collection ${collectionName} refresh callback:`, error)
        }
      })
    }
  }, [collectionRefreshCallbacks])

  const onCollectionsRefresh = useCallback((callback: () => void) => {
    setCollectionsRefreshCallbacks(prev => {
      const newSet = new Set(prev)
      newSet.add(callback)
      return newSet
    })

    // 返回取消订阅函数
    return () => {
      setCollectionsRefreshCallbacks(prev => {
        const newSet = new Set(prev)
        newSet.delete(callback)
        return newSet
      })
    }
  }, [])

  const onCollectionRefresh = useCallback((collectionName: string, callback: () => void) => {
    setCollectionRefreshCallbacks(prev => {
      const newMap = new Map(prev)
      const callbacks = newMap.get(collectionName) || new Set()
      callbacks.add(callback)
      newMap.set(collectionName, callbacks)
      return newMap
    })

    // 返回取消订阅函数
    return () => {
      setCollectionRefreshCallbacks(prev => {
        const newMap = new Map(prev)
        const callbacks = newMap.get(collectionName)
        if (callbacks) {
          callbacks.delete(callback)
          if (callbacks.size === 0) {
            newMap.delete(collectionName)
          } else {
            newMap.set(collectionName, callbacks)
          }
        }
        return newMap
      })
    }
  }, [])

  return (
    <DataRefreshContext.Provider 
      value={{
        refreshCollections,
        refreshCollection,
        onCollectionsRefresh,
        onCollectionRefresh,
      }}
    >
      {children}
    </DataRefreshContext.Provider>
  )
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext)
  if (context === undefined) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider')
  }
  return context
}
