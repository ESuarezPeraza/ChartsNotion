'use client'

import { useSearchParams } from 'next/navigation'
import { useNotionData } from '@/hooks/useNotionData'
import BaseChart from '@/components/charts/BaseChart'
import ChartContainer from '@/components/ChartContainer'
import LoadingHUD from '@/components/ui/LoadingHUD'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import {
    getBarChartOptions,
    getLineChartOptions,
    getPieChartOptions,
} from '@/lib/chartTheme'

interface ChartPageProps {
    params: { type: string }
}

export default function ChartPage({ params }: ChartPageProps) {
    const { type } = params
    const searchParams = useSearchParams()

    // Get query parameters
    const databaseId = searchParams.get('db') || ''
    const xProperty = searchParams.get('x') || ''
    const yProperty = searchParams.get('y') || undefined
    const aggregation = searchParams.get('agg') as 'sum' | 'count' | 'average' | undefined
    const customTitle = searchParams.get('title') || undefined
    const height = parseInt(searchParams.get('h') || '400')

    // Fetch data using SWR hook
    const { data, isLoading, isError, error, refresh } = useNotionData({
        databaseId,
        chartType: type,
        xProperty,
        yProperty,
        aggregation,
    })

    // Validate required params
    if (!databaseId || !xProperty) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <ErrorDisplay
                    message="Missing required parameters: db (database ID) and x (X axis property)"
                />
            </div>
        )
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingHUD message="FETCHING NOTION DATA..." />
            </div>
        )
    }

    // Error state
    if (isError) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <ErrorDisplay
                    message={error?.message || 'Failed to load data'}
                    onRetry={refresh}
                />
            </div>
        )
    }

    // Get chart options based on type
    const getChartOptions = () => {
        const title = customTitle || `${xProperty.toUpperCase()} ANALYSIS`

        switch (type) {
            case 'bar':
                return getBarChartOptions(data, title)
            case 'line':
                return getLineChartOptions(data, title)
            case 'pie':
                return getPieChartOptions(data, title)
            case 'area':
                // Area chart is just line chart with area style (already included)
                return getLineChartOptions(data, title)
            default:
                return getBarChartOptions(data, title)
        }
    }

    return (
        <main className="min-h-screen p-2 bg-transparent">
            <ChartContainer>
                <BaseChart
                    option={getChartOptions()}
                    height={height}
                />
            </ChartContainer>
        </main>
    )
}
