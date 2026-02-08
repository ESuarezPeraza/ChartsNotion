'use client'

import { useSearchParams } from 'next/navigation'
import { useNotionData } from '@/hooks/useNotionData'
import BaseChart from '@/components/charts/BaseChart'
import ChartContainer from '@/components/ChartContainer'
import LoadingHUD from '@/components/ui/LoadingHUD'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { EChartsOption } from 'echarts'

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

    // Advanced options
    const colorsParam = searchParams.get('colors')
    const colors = colorsParam ? colorsParam.split(',') : ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']
    const showLegend = searchParams.get('legend') === 'true'
    const showLabels = searchParams.get('labels') === 'true'
    const showGrid = searchParams.get('grid') === 'true'
    // Line/Area options
    const smooth = parseFloat(searchParams.get('smooth') || '0.5')
    const lineWidth = parseInt(searchParams.get('lineWidth') || '3')
    const symbolSize = parseInt(searchParams.get('symbolSize') || '8')
    const showSymbols = searchParams.get('showSymbols') !== 'false'
    // Bar options
    const barRadius = parseInt(searchParams.get('barRadius') || '6')
    const barMaxWidth = parseInt(searchParams.get('barMaxWidth') || '60')
    // Pie options
    const pieInnerRadius = parseInt(searchParams.get('pieInnerRadius') || '45')
    const pieBorderWidth = parseInt(searchParams.get('pieBorderWidth') || '2')
    // Sorting
    const sortBy = searchParams.get('sortBy') as 'x' | 'y' | 'manual' | undefined
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined
    const fontSize = parseInt(searchParams.get('fontSize') || '12')
    // Axis visibility
    const showXAxis = searchParams.get('showXAxis') !== 'false'
    const showYAxis = searchParams.get('showYAxis') !== 'false'

    // Granular options
    const manualOrderParam = searchParams.get('manualOrder')
    const manualOrder = manualOrderParam ? manualOrderParam.split(',') : []
    const excludedParam = searchParams.get('excluded')
    const excludedCategories = excludedParam ? excludedParam.split(',') : []
    const catColorsParam = searchParams.get('catColors')
    const categoryColors = catColorsParam ? JSON.parse(catColorsParam) as Record<string, string> : {}

    // Fetch data using SWR hook
    const { data: rawData, isLoading, isError, error, refresh } = useNotionData({
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
                <LoadingHUD message="CARGANDO DATOS..." />
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

    // Process data
    let processedData = [...(rawData || [])];

    // Filtering
    processedData = processedData.filter(d => !excludedCategories.includes(d.name))

    // Sorting logic
    if (sortBy === 'manual' && manualOrder.length > 0) {
        processedData.sort((a, b) => {
            const idxA = manualOrder.indexOf(a.name)
            const idxB = manualOrder.indexOf(b.name)
            const aPos = idxA === -1 ? 9999 : idxA
            const bPos = idxB === -1 ? 9999 : idxB
            return aPos - bPos
        })
    } else if (sortBy) {
        processedData.sort((a: any, b: any) => {
            let valA: any = sortBy === 'x' ? a.name : a.value
            let valB: any = sortBy === 'x' ? b.name : b.value

            // Check if values are dates (ISO format: YYYY-MM-DD or with time)
            const isDateA = typeof valA === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valA)
            const isDateB = typeof valB === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valB)

            if (isDateA && isDateB) {
                // Sort by date timestamp
                valA = new Date(valA).getTime()
                valB = new Date(valB).getTime()
            } else {
                // Try numeric sorting
                const numA = Number(valA)
                const numB = Number(valB)

                if (sortBy === 'x' && !isNaN(numA) && !isNaN(numB)) {
                    valA = numA
                    valB = numB
                }
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1
            return 0
        })
    }

    const getCategoryColor = (name: string, index: number) => {
        if (categoryColors[name]) return categoryColors[name]
        return colors[index % colors.length]
    }

    // Get chart options based on type
    const getChartOptions = (): EChartsOption => {
        const titleText = customTitle

        const baseOptions = {
            backgroundColor: 'transparent',
            textStyle: { fontFamily: 'Inter, sans-serif', color: '#374151', fontSize },
            tooltip: {
                backgroundColor: '#fff',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                textStyle: { color: '#374151', fontFamily: 'Inter, sans-serif', fontSize },
                trigger: (type === 'pie' ? 'item' : 'axis') as 'item' | 'axis',
                extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
            },
            title: titleText ? {
                text: titleText,
                textStyle: { color: '#111827', fontWeight: 600, fontSize: fontSize + 4 },
                left: 'center',
                top: 10,
            } : undefined,
            legend: showLegend ? {
                show: true,
                bottom: 0,
                textStyle: { color: '#6b7280', fontSize: fontSize - 1 },
            } : { show: false },
        }

        if (type === 'pie') {
            return {
                ...baseOptions,
                series: [{
                    type: 'pie',
                    radius: [`${pieInnerRadius}%`, '75%'],
                    center: ['50%', showLegend ? '50%' : '55%'],
                    data: processedData.map((d, i) => ({
                        ...d,
                        itemStyle: { color: getCategoryColor(d.name, i) },
                    })),
                    label: showLabels ? {
                        show: true,
                        color: '#374151',
                        fontSize,
                        formatter: '{b}: {c} ({d}%)'
                    } : { show: false },
                    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: pieBorderWidth },
                }],
            }
        }

        return {
            ...baseOptions,
            grid: {
                left: '3%',
                right: '4%',
                bottom: showLegend ? '15%' : '8%',
                top: titleText ? '15%' : '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                show: showXAxis,
                data: processedData.map(d => d.name),
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280', fontSize: fontSize - 1 },
                axisTick: { show: false },
            },
            yAxis: {
                type: 'value',
                show: showYAxis,
                axisLine: { show: false },
                splitLine: showGrid ? {
                    lineStyle: { color: '#f3f4f6', type: 'dashed' }
                } : { show: false },
                axisLabel: { color: '#6b7280', fontSize: fontSize - 1 },
            },
            series: [{
                name: xProperty,
                type: (type === 'area' ? 'line' : type) as 'line' | 'bar' | 'pie',
                data: processedData.map((d, i) => ({
                    value: d.value,
                    itemStyle: { color: getCategoryColor(d.name, i) }
                })),
                ...(type === 'bar' && {
                    itemStyle: {
                        borderRadius: [barRadius, barRadius, 0, 0],
                    },
                    barMaxWidth: barMaxWidth,
                    label: showLabels ? {
                        show: true,
                        position: 'top',
                        color: '#6b7280',
                        fontSize: fontSize - 2,
                    } : { show: false },
                }),
                ...(type === 'line' || type === 'area' ? {
                    smooth: smooth,
                    lineStyle: { width: lineWidth, color: getCategoryColor(xProperty, 0) },
                    symbol: showSymbols ? 'circle' : 'none',
                    symbolSize: symbolSize,
                    itemStyle: { color: getCategoryColor(xProperty, 0) },
                    areaStyle: type === 'area' ? {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: getCategoryColor(xProperty, 0) + '40' },
                                { offset: 1, color: getCategoryColor(xProperty, 0) + '05' }
                            ]
                        },
                    } : undefined,
                } : {}),
            } as any],
        }
    }

    return (
        <main className="min-h-screen bg-transparent p-2">
            <ChartContainer>
                <BaseChart
                    option={getChartOptions()}
                    height={height}
                />
            </ChartContainer>
        </main>
    )
}
