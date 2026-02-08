import { Client } from '@notionhq/client'
import type {
    QueryDatabaseResponse,
    PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'

// Singleton instance
let notionClient: Client | null = null

export function getNotionClient(): Client {
    if (!notionClient) {
        if (!process.env.NOTION_TOKEN) {
            throw new Error('NOTION_TOKEN environment variable is not set')
        }
        notionClient = new Client({
            auth: process.env.NOTION_TOKEN,
        })
    }
    return notionClient
}

/**
 * Query a Notion database and return all pages
 */
export async function queryDatabase(
    databaseId: string,
    filter?: object,
    sorts?: Array<{ property: string; direction: 'ascending' | 'descending' }>
): Promise<PageObjectResponse[]> {
    const notion = getNotionClient()

    const response: QueryDatabaseResponse = await notion.databases.query({
        database_id: databaseId,
        filter: filter as any,
        sorts: sorts,
    })

    // Filter to only PageObjectResponse (exclude PartialPageObjectResponse)
    return response.results.filter(
        (page): page is PageObjectResponse => 'properties' in page
    )
}

/**
 * Extract property value from a Notion page
 */
export function getPropertyValue(
    page: PageObjectResponse,
    propertyName: string
): string | number | boolean | null {
    const property = page.properties[propertyName]

    if (!property) return null

    switch (property.type) {
        case 'title':
            return property.title[0]?.plain_text ?? ''
        case 'rich_text':
            return property.rich_text[0]?.plain_text ?? ''
        case 'number':
            return property.number
        case 'select':
            return property.select?.name ?? null
        case 'multi_select':
            return property.multi_select.map(s => s.name).join(', ')
        case 'date':
            return property.date?.start ?? null
        case 'checkbox':
            return property.checkbox
        case 'status':
            return property.status?.name ?? null
        case 'formula':
            if (property.formula.type === 'number') return property.formula.number
            if (property.formula.type === 'string') return property.formula.string
            if (property.formula.type === 'boolean') return property.formula.boolean
            return null
        case 'rollup':
            if (property.rollup.type === 'number') return property.rollup.number
            return null
        default:
            return null
    }
}

/**
 * Get database schema (property names and types)
 */
export async function getDatabaseSchema(databaseId: string) {
    const notion = getNotionClient()
    const database = await notion.databases.retrieve({ database_id: databaseId })

    return Object.entries(database.properties).map(([name, prop]) => ({
        name,
        type: prop.type,
    }))
}
