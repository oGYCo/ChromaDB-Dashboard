"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Filter } from 'lucide-react';

export type FilterOperator = "equals" | "contains" | "exists" | "not_exists" | "not_empty";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: string;
}

interface MetadataFilterProps {
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

const operatorLabels: Record<FilterOperator, string> = {
  equals: "Equals",
  contains: "Contains",
  exists: "Exists",
  not_exists: "Not Exists", 
  not_empty: "Not Empty"
};

const operatorDescriptions: Record<FilterOperator, string> = {
  equals: "",
  contains: "",
  exists: "",
  not_exists: "",
  not_empty: ""
};

const needsValue = (operator: FilterOperator): boolean => {
  return operator === "equals" || operator === "contains";
};

export function MetadataFilter({ 
  filters, 
  onFiltersChange, 
  onApplyFilters, 
  onClearFilters,
  isLoading = false 
}: MetadataFilterProps) {
  const [newCondition, setNewCondition] = useState<FilterCondition>({
    field: "",
    operator: "equals",
    value: ""
  });

  const addCondition = () => {
    if (!newCondition.field.trim()) return;
    
    // For operators that need a value, ensure value is provided
    if (needsValue(newCondition.operator) && !newCondition.value?.trim()) {
      return; // Don't add condition if value is required but not provided
    }
    
    // Create the condition, only include value if needed
    const condition: FilterCondition = {
      field: newCondition.field.trim(),
      operator: newCondition.operator
    };
    
    if (needsValue(newCondition.operator) && newCondition.value) {
      condition.value = newCondition.value.trim();
    }
    
    onFiltersChange([...filters, condition]);
    
    // Reset form
    setNewCondition({
      field: "",
      operator: "equals",
      value: ""
    });
  };

  const removeCondition = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onFiltersChange(newFilters);
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const newFilters = filters.map((filter, i) => {
      if (i === index) {
        const updated = { ...filter, ...updates };
        // Remove value if operator doesn't need it
        if (!needsValue(updated.operator)) {
          delete updated.value;
        }
        return updated;
      }
      return filter;
    });
    onFiltersChange(newFilters);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Metadata Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Filters */}
        {filters.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Filters:</Label>
            <div className="space-y-2">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <Input
                    value={filter.field}
                    onChange={(e) => updateCondition(index, { field: e.target.value })}
                    placeholder="Field name"
                    className="w-32"
                  />
                  <Select
                    value={filter.operator}
                    onValueChange={(value: FilterOperator) => updateCondition(index, { operator: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(operatorLabels).map(([op, label]) => (
                        <SelectItem key={op} value={op}>
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {operatorDescriptions[op as FilterOperator]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {needsValue(filter.operator) && (
                    <Input
                      value={filter.value || ""}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1"
                    />
                  )}
                  {!needsValue(filter.operator) && (
                    <Badge variant="outline" className="flex-1 justify-center">
                      {operatorDescriptions[filter.operator]}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Condition */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Add New Filter Condition:</Label>
          <div className="flex items-center gap-2">
            <Input
              value={newCondition.field}
              onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value })}
              placeholder="Field name"
              className="w-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCondition();
                }
              }}
            />
            <Select
              value={newCondition.operator}
              onValueChange={(value: FilterOperator) => 
                setNewCondition({ ...newCondition, operator: value, value: "" })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(operatorLabels).map(([op, label]) => (
                  <SelectItem key={op} value={op}>
                    <div className="flex flex-col">
                      <span>{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {operatorDescriptions[op as FilterOperator]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsValue(newCondition.operator) && (
              <Input
                value={newCondition.value || ""}
                onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
                placeholder="Value"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addCondition();
                  }
                }}
              />
            )}
            {!needsValue(newCondition.operator) && (
              <Badge variant="outline" className="flex-1 justify-center">
                {operatorDescriptions[newCondition.operator]}
              </Badge>
            )}
            <Button
              onClick={addCondition}
              disabled={
                !newCondition.field.trim() || 
                (needsValue(newCondition.operator) && !newCondition.value?.trim())
              }
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            onClick={onApplyFilters}
            disabled={isLoading || filters.length === 0}
            className="flex-1"
          >
            {isLoading ? "Filtering..." : "Apply Filters"}
          </Button>
          <Button 
            variant="outline"
            onClick={onClearFilters}
            disabled={isLoading || filters.length === 0}
          >
            Clear
          </Button>
        </div>

        {/* Status Info */}
        {filters.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Currently {filters.length} filter condition{filters.length > 1 ? 's' : ''} set
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MetadataFilter;
