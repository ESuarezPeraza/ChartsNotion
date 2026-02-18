import { NextRequest, NextResponse } from 'next/server'
import { queryDatabase, getPropertyValue } from '@/lib/notion'

/**
 * GET /api/notion/contribution/[databaseId]
 * 
 * Query params:
 * - date:        Property name for the date field (required)
 * - subject:     Property name for the subject/title field (required)
 * - description: Property name for the description field (required)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { databaseId: string } }
) {
    try {
        const { databaseId } = params
        const searchParams = request.nextUrl.searchParams

        const dateProperty = searchParams.get('date')
        const subjectProperty = searchParams.get('subject')
        const descriptionProperty = searchParams.get('description')

        // Validate required params
        if (!dateProperty || !subjectProperty || !descriptionProperty) {
            return NextResponse.json(
                { error: 'Missing required parameters: date, subject, description' },
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
            return NextResponse.json({ entries: [] })
        }

        // Extract contribution entries
        const entries = pages
            .map(page => {
                const date = getPropertyValue(page, dateProperty)
                const subject = getPropertyValue(page, subjectProperty)
                const description = getPropertyValue(page, descriptionProperty)

                if (!date || typeof date !== 'string') return null

                return {
                    date: date.split('T')[0], // Normalize to YYYY-MM-DD
                    subject: String(subject ?? ''),
                    description: String(description ?? ''),
                }
            })
            .filter(Boolean)

        return NextResponse.json({ entries })
    } catch (error) {
        console.error('Notion API Error:', error)

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
