import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

// Chart Types
export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'contribution'

// Chart Data Point
export interface ChartDataPoint {
    name: string
    value: number
}

// API Response
export interface ChartApiResponse {
    data: ChartDataPoint[]
    title?: string
    databaseName?: string
}

// API Error
export interface ApiError {
    error: string
    details?: string
}

// Chart Component Props
export interface ChartProps {
    data: ChartDataPoint[]
    title?: string
    height?: number | string
    loading?: boolean
}

// Query Parameters for chart routes
export interface ChartQueryParams {
    db: string           // Database ID
    x: string            // X axis property
    y?: string           // Y axis property (optional for count aggregations)
    agg?: 'sum' | 'count' | 'average'
    title?: string       // Optional custom title
}

// Notion Page with typed properties
export type NotionPage = PageObjectResponse

// Contribution Graph Entry
export interface ContributionEntry {
    date: string        // ISO date string (YYYY-MM-DD)
    subject: string     // Subject/title of the activity
    description: string // Description of the activity
}

// Contribution Graph API Response
export interface ContributionApiResponse {
    entries: ContributionEntry[]
}

// Property types we support
export type SupportedPropertyType =
    | 'title'
    | 'rich_text'
    | 'number'
    | 'select'
    | 'multi_select'
    | 'date'
    | 'checkbox'
    | 'status'
    | 'formula'
    | 'rollup'
