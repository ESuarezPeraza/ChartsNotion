import { NextRequest, NextResponse } from 'next/server'
import { queryDatabase, getDatabaseSchema } from '@/lib/notion'
import { transformToChartData, transformToCountByProperty } from '@/lib/transformers'

/**
 * GET /api/notion/[databaseId]
 * 
 * Query params:
 * - x:   Property name for X axis / labels (required)
 * - y:   Property name for Y axis / values (optional, uses count if not provided)
 * - agg: Aggregation type: 'sum' | 'count' | 'average' (default: 'sum')
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { databaseId: string } }
) {
    try {
        const { databaseId } = params
        const searchParams = request.nextUrl.searchParams

        const xProperty = searchParams.get('x')
        const yProperty = searchParams.get('y')
        const aggregation = searchParams.get('agg') as 'sum' | 'count' | 'average' | null

        // Validate required params
        if (!xProperty) {
            return NextResponse.json(
                { error: 'Missing required parameter: x (X axis property)' },
                { status: 400 }
            )
        }

        // Validate database ID format
        if (!databaseId || databaseId.length < 32) {
            return NextResponse.json(
                { error: 'Invalid database ID format' },
                { status: 400 }
            )
        }

        // Query Notion database
        const pages = await queryDatabase(databaseId)

        if (pages.length === 0) {
            return NextResponse.json({
                data: [],
                title: 'No data found',
            })
        }

        // Transform data based on params
        let data
        if (yProperty) {
            // Use provided Y property for values
            data = transformToChartData(pages, {
                xProperty,
                yProperty,
                aggregation: aggregation || 'sum',
            })
        } else {
            // Count by X property (no Y needed)
            data = transformToCountByProperty(pages, xProperty)
        }

        return NextResponse.json({
            data,
            count: pages.length,
        })
    } catch (error) {
        console.error('Notion API Error:', error)

        // Handle specific Notion errors
        if (error instanceof Error) {
            if (error.message.includes('Could not find database')) {
                return NextResponse.json(
                    { error: 'Database not found. Check the ID and integration permissions.' },
                    { status: 404 }
                )
            }
            if (error.message.includes('NOTION_TOKEN')) {
                return NextResponse.json(
                    { error: 'Notion token not configured' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Failed to fetch data from Notion' },
            { status: 500 }
        )
    }
}
