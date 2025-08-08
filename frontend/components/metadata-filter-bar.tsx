"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Filter, X, Plus } from "lucide-react"

interface MetadataFilter {
  key: string
  operator: 'equals' | 'contains' | 'exists' | 'not_exists' | 'not_empty'
  value?: string
}

interface MetadataFilterBarProps {
  onFilter: (filters: MetadataFilter[]) => void
  isLoading?: boolean
  onClear: () => void
}

export function MetadataFilterBar({ onFilter, isLoading = false, onClear }: MetadataFilterBarProps) {
  const [filters, setFilters] = useState<MetadataFilter[]>([])
  const [currentKey, setCurrentKey] = useState("")
  const [currentOperator, setCurrentOperator] = useState<MetadataFilter['operator']>('equals')
  const [currentValue, setCurrentValue] = useState("")

  const addFilter = () => {
    if (currentKey.trim()) {
      const newFilter: MetadataFilter = {
        key: currentKey.trim(),
        operator: currentOperator,
        value: currentOperator !== 'exists' && currentOperator !== 'not_exists' && currentOperator !== 'not_empty' ? currentValue.trim() : undefined
      }
      
      const updatedFilters = [...filters, newFilter]
      setFilters(updatedFilters)
      setCurrentKey("")
      setCurrentValue("")
      onFilter(updatedFilters)
    }
  }

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index)
    setFilters(updatedFilters)
    if (updatedFilters.length === 0) {
      onClear()
    } else {
      onFilter(updatedFilters)
    }
  }

  const clearAllFilters = () => {
    setFilters([])
    setCurrentKey("")
    setCurrentValue("")
    onClear()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addFilter()
  }

  const formatFilterLabel = (filter: MetadataFilter) => {
    switch (filter.operator) {
      case 'equals':
        return `${filter.key} = "${filter.value}"`
      case 'contains':
        return `${filter.key} contains "${filter.value}"`
      case 'exists':
        return `${filter.key} exists`
      case 'not_exists':
        return `${filter.key} not exists`
      case 'not_empty':
        return `${filter.key} is not empty`
      default:
        return `${filter.key} ${filter.operator} ${filter.value}`
    }
  }

  const requiresValue = currentOperator === 'equals' || currentOperator === 'contains'

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="metadataKey">Metadata Key</Label>
          <Input
            id="metadataKey"
            type="text"
            placeholder="e.g., author, category, type..."
            value={currentKey}
            onChange={(e) => setCurrentKey(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="w-40">
          <Label htmlFor="operator">Operator</Label>
          <select 
            value={currentOperator} 
            onChange={(e) => setCurrentOperator(e.target.value as MetadataFilter['operator'])}
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
            disabled={isLoading}
          >
            <option value="equals">Equals</option>
            <option value="contains">Contains</option>
            <option value="exists">Key Exists</option>
            <option value="not_exists">Key Not Exists</option>
            <option value="not_empty">Not Empty</option>
          </select>
        </div>
        {requiresValue && (
          <div className="flex-1">
            <Label htmlFor="metadataValue">Value</Label>
            <Input
              id="metadataValue"
              type="text"
              placeholder="Enter value..."
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}
        <Button 
          type="submit" 
          disabled={isLoading || !currentKey.trim() || (requiresValue && !currentValue.trim())}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Filter
        </Button>
      </form>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Active Filters:</Label>
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <div key={index} className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-secondary rounded-md border">
                {formatFilterLabel(filter)}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter(index)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
