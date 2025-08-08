import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { collectionName: string } }
) {
  try {
    const { filters } = await request.json()
    const collectionName = decodeURIComponent(params.collectionName)

    // 构建 ChromaDB 的 where 查询条件
    let whereConditions: any = {}
    
    if (filters.length === 0) {
      // 没有过滤条件，返回空结果
      return NextResponse.json({
        data: [],
        total: 0,
        page: 1,
        limit: 0
      })
    }
    
    if (filters.length === 1) {
      // 单个过滤条件
      const filter = filters[0]
      switch (filter.operator) {
        case 'equals':
          // 精确匹配：只匹配完全相等的值
          whereConditions[filter.key] = { "$eq": filter.value }
          break
        case 'contains':
          // 包含匹配：字符串包含指定子串
          whereConditions[filter.key] = { "$contains": filter.value }
          break
        case 'exists':
          // 字段存在：不为null且不为空字符串
          whereConditions = {
            "$and": [
              { [filter.key]: { "$ne": null } },
              { [filter.key]: { "$ne": "" } }
            ]
          }
          break
        case 'not_exists':
          // 字段不存在：为null或完全不存在该字段
          whereConditions[filter.key] = null
          break
        case 'not_empty':
          // 不为空：存在且不为空字符串和null
          whereConditions = {
            "$and": [
              { [filter.key]: { "$ne": "" } },
              { [filter.key]: { "$ne": null } }
            ]
          }
          break
      }
    } else {
      // 多个过滤条件，使用 $and 组合
      const conditions: any[] = []
      
      for (const filter of filters) {
        switch (filter.operator) {
          case 'equals':
            conditions.push({ [filter.key]: { "$eq": filter.value } })
            break
          case 'contains':
            conditions.push({ [filter.key]: { "$contains": filter.value } })
            break
          case 'exists':
            conditions.push({ [filter.key]: { "$ne": null } })
            conditions.push({ [filter.key]: { "$ne": "" } })
            break
          case 'not_exists':
            conditions.push({ [filter.key]: null })
            break
          case 'not_empty':
            conditions.push({ [filter.key]: { "$ne": "" } })
            conditions.push({ [filter.key]: { "$ne": null } })
            break
        }
      }
      
      whereConditions = { "$and": conditions }
    }

    console.log('Filter conditions:', JSON.stringify(whereConditions, null, 2))

    const response = await fetch(`${process.env.API_BASE_URL}/collections/${collectionName}/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ where: whereConditions }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Filter error:', error)
    return NextResponse.json(
      { error: 'Failed to filter documents' },
      { status: 500 }
    )
  }
}
