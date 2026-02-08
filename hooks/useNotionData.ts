import useSWR from 'swr'
import type { ChartDataPoint } from '@/lib/transformers'

interface UseNotionDataOptions {
    databaseId: string
    chartType?: string
    xProperty?: string
    yProperty?: string
    aggregation?: 'sum' | 'count' | 'average'
}

interface NotionDataResponse {
    data: ChartDataPoint[]
    title?: string
}

const fetcher = async (url: string): Promise<NotionDataResponse> => {
    const res = await fetch(url)
    if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch data')
    }
    return res.json()
}

/**
 * Hook for fetching and caching Notion data with SWR
 */
export function useNotionData(options: UseNotionDataOptions) {
    const { databaseId, chartType, xProperty, yProperty, aggregation } = options

    // Build query params
    const params = new URLSearchParams()
    if (chartType) params.set('type', chartType)
    if (xProperty) params.set('x', xProperty)
    if (yProperty) params.set('y', yProperty)
    if (aggregation) params.set('agg', aggregation)

    const url = `/api/notion/${databaseId}?${params.toString()}`

    const { data, error, isLoading, mutate } = useSWR<NotionDataResponse>(
        databaseId ? url : null,
        fetcher,
        {
            // Revalidate every 30 seconds for near real-time updates
            refreshInterval: 30000,
            // Keep previous data while revalidating
            revalidateOnFocus: true,
            // Retry on error
            errorRetryCount: 3,
            errorRetryInterval: 5000,
        }
    )

    return {
        data: data?.data ?? [],
        title: data?.title,
        isLoading,
        isError: !!error,
        error: error as Error | undefined,
        refresh: mutate,
    }
}
