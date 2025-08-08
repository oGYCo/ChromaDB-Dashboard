import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const host = searchParams.get('host') || 'localhost'
  const port = searchParams.get('port') || '8001'

  try {
    // Test connection to the specified ChromaDB instance
    const response = await fetch(`http://${host}:${port}/api/v1/heartbeat`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return NextResponse.json({ 
        status: 'ok', 
        message: `Successfully connected to ChromaDB at ${host}:${port}` 
      })
    } else {
      // Check if it's a v2 API response
      if (response.status === 410) {
        // Try v2 heartbeat endpoint
        try {
          const v2Response = await fetch(`http://${host}:${port}/api/v2/heartbeat`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (v2Response.ok) {
            return NextResponse.json({ 
              status: 'ok', 
              message: `Successfully connected to ChromaDB v2 at ${host}:${port}` 
            })
          }
        } catch (v2Error) {
          // Fall through to error handling
        }
      }
      
      return NextResponse.json({ 
        status: 'error', 
        detail: `Failed to connect to ChromaDB at ${host}:${port}` 
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      detail: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
