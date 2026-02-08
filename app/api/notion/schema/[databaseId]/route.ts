import { NextRequest, NextResponse } from 'next/server'
import { getDatabaseSchema } from '@/lib/notion'

/**
 * GET /api/notion/schema/[databaseId]
 * 
 * Returns the schema (properties) of a Notion database
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { databaseId: string } }
) {
    try {
        const { databaseId } = params

        // Validate database ID format
        if (!databaseId || databaseId.length < 32) {
            return NextResponse.json(
                { error: 'ID de base de datos inválido' },
                { status: 400 }
            )
        }

        // Get database schema
        const schema = await getDatabaseSchema(databaseId)

        // Group properties by type for better UX
        const properties = schema.map(prop => ({
            name: prop.name,
            type: prop.type,
            // Useful for UI hints
            isNumeric: ['number', 'formula', 'rollup'].includes(prop.type),
            isCategory: ['select', 'multi_select', 'status', 'checkbox'].includes(prop.type),
            isDate: prop.type === 'date',
            isText: ['title', 'rich_text'].includes(prop.type),
        }))

        return NextResponse.json({
            properties,
            count: properties.length,
        })
    } catch (error) {
        console.error('Notion Schema Error:', error)

        if (error instanceof Error) {
            if (error.message.includes('Could not find database')) {
                return NextResponse.json(
                    { error: 'Base de datos no encontrada. Verifica el ID y los permisos de la integración.' },
                    { status: 404 }
                )
            }
            if (error.message.includes('NOTION_TOKEN')) {
                return NextResponse.json(
                    { error: 'Token de Notion no configurado' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Error al obtener el esquema de la base de datos' },
            { status: 500 }
        )
    }
}
