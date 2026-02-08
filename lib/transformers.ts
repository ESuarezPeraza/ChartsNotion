import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { getPropertyValue } from './notion'

export interface ChartDataPoint {
    name: string
    value: number
}

export interface TransformOptions {
    xProperty: string      // Property name for X axis / labels
    yProperty: string      // Property name for Y axis / values
    aggregation?: 'sum' | 'count' | 'average'  // How to aggregate duplicate X values
}

/**
 * Transform Notion pages into chart-ready data
 */
export function transformToChartData(
    pages: PageObjectResponse[],
    options: TransformOptions
): ChartDataPoint[] {
    const { xProperty, yProperty, aggregation = 'sum' } = options

    // Group by X property value
    const grouped = new Map<string, number[]>()

    for (const page of pages) {
        const xValue = getPropertyValue(page, xProperty)
        const yValue = getPropertyValue(page, yProperty)

        if (xValue === null) continue

        const xKey = String(xValue)
        const yNum = typeof yValue === 'number' ? yValue : 0

        if (!grouped.has(xKey)) {
            grouped.set(xKey, [])
        }
        grouped.get(xKey)!.push(yNum)
    }

    // Apply aggregation
    const result: ChartDataPoint[] = []

    for (const [name, values] of grouped) {
        let value: number

        switch (aggregation) {
            case 'count':
                value = values.length
                break
            case 'average':
                value = values.reduce((a, b) => a + b, 0) / values.length
                break
            case 'sum':
            default:
                value = values.reduce((a, b) => a + b, 0)
                break
        }

        result.push({ name, value: Math.round(value * 100) / 100 })
    }

    return result
}

/**
 * Transform for counting items by a select/status property
 */
export function transformToCountByProperty(
    pages: PageObjectResponse[],
    propertyName: string
): ChartDataPoint[] {
    const counts = new Map<string, number>()

    for (const page of pages) {
        const value = getPropertyValue(page, propertyName)
        if (value === null) continue

        const key = String(value)
        counts.set(key, (counts.get(key) || 0) + 1)
    }

    return Array.from(counts.entries()).map(([name, value]) => ({
        name,
        value,
    }))
}

/**
 * Transform for time-series data (group by date)
 */
export function transformToTimeSeries(
    pages: PageObjectResponse[],
    dateProperty: string,
    valueProperty: string,
    granularity: 'day' | 'week' | 'month' = 'day'
): ChartDataPoint[] {
    const grouped = new Map<string, number[]>()

    for (const page of pages) {
        const dateValue = getPropertyValue(page, dateProperty)
        const numValue = getPropertyValue(page, valueProperty)

        if (dateValue === null || typeof dateValue !== 'string') continue

        const date = new Date(dateValue)
        let key: string

        switch (granularity) {
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                break
            case 'week':
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - date.getDay())
                key = weekStart.toISOString().split('T')[0]
                break
            case 'day':
            default:
                key = date.toISOString().split('T')[0]
                break
        }

        const yNum = typeof numValue === 'number' ? numValue : 1

        if (!grouped.has(key)) {
            grouped.set(key, [])
        }
        grouped.get(key)!.push(yNum)
    }

    // Sort by date and sum values
    return Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, values]) => ({
            name,
            value: values.reduce((a, b) => a + b, 0),
        }))
}
