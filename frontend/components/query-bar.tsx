"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"

interface QueryBarProps {
  onQuery: (queryText: string, nResults: number) => void
  isLoading?: boolean
}

export function QueryBar({ onQuery, isLoading = false }: QueryBarProps) {
  const [queryText, setQueryText] = useState("")
  const [nResults, setNResults] = useState(5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (queryText.trim()) {
      onQuery(queryText.trim(), nResults)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
      <div className="flex-1">
        <Label htmlFor="query">Query Text</Label>
        <Input
          id="query"
          type="text"
          placeholder="Enter your search query..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="w-32">
        <Label htmlFor="nResults">Results</Label>
        <Input
          id="nResults"
          type="number"
          min="1"
          max="100"
          value={nResults}
          onChange={(e) => setNResults(parseInt(e.target.value) || 5)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading || !queryText.trim()}>
        <Search className="w-4 h-4 mr-2" />
        {isLoading ? "Searching..." : "Search"}
      </Button>
    </form>
  )
}
