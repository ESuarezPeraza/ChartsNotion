import useSWR from 'swr'
import type { ContributionEntry } from '@/types'

interface UseContributionDataOptions {
    databaseId: string
    dateProperty: string
    subjectProperty: string
    descriptionProperty: string
}

interface ContributionDataResponse {
    entries: ContributionEntry[]
}

const fetcher = async (url: string): Promise<ContributionDataResponse> => {
    const res = await fetch(url)
    if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch data')
    }
    return res.json()
}

/**
 * Hook for fetching contribution graph data from Notion with SWR
 */
export function useContributionData(options: UseContributionDataOptions) {
    const { databaseId, dateProperty, subjectProperty, descriptionProperty } = options

    // Build query params
    const params = new URLSearchParams()
    if (dateProperty) params.set('date', dateProperty)
    if (subjectProperty) params.set('subject', subjectProperty)
    if (descriptionProperty) params.set('description', descriptionProperty)

    const url = `/api/notion/contribution/${databaseId}?${params.toString()}`

    const { data, error, isLoading, mutate } = useSWR<ContributionDataResponse>(
        databaseId && dateProperty && subjectProperty && descriptionProperty ? url : null,
        fetcher,
        {
            refreshInterval: 30000,
            revalidateOnFocus: true,
            errorRetryCount: 3,
            errorRetryInterval: 5000,
        }
    )

    return {
        entries: data?.entries ?? [],
        isLoading,
        isError: !!error,
        error: error as Error | undefined,
        refresh: mutate,
    }
}
