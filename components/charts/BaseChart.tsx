'use client'

import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { cyberpunkTheme } from '@/lib/chartTheme'

interface BaseChartProps {
    option: EChartsOption
    height?: number | string
    loading?: boolean
    className?: string
}

/**
 * Base ECharts wrapper with Cyberpunk theme
 */
export default function BaseChart({
    option,
    height = 400,
    loading = false,
    className = '',
}: BaseChartProps) {
    // Merge options with theme
    const mergedOption: EChartsOption = {
        ...cyberpunkTheme,
        ...option,
        // Deep merge specific properties
        textStyle: {
            ...cyberpunkTheme.textStyle,
            ...option.textStyle,
        },
        tooltip: {
            ...cyberpunkTheme.tooltip,
            ...option.tooltip,
        },
    }

    return (
        <div className={`relative ${className}`}>
            <ReactECharts
                option={mergedOption}
                style={{ height, width: '100%' }}
                opts={{ renderer: 'canvas' }}
                showLoading={loading}
                loadingOption={{
                    text: 'LOADING...',
                    color: '#00f3ff',
                    textColor: '#00f3ff',
                    maskColor: 'rgba(10, 10, 15, 0.8)',
                    fontFamily: '"JetBrains Mono", monospace',
                }}
                notMerge={true}
                lazyUpdate={true}
            />
        </div>
    )
}
