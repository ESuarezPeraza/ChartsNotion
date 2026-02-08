import type { EChartsOption } from 'echarts'

/**
 * Cyberpunk theme configuration for ECharts
 * Colors: Neon Cyan (#00f3ff) and Magenta (#ff00ff)
 */
export const cyberpunkTheme: EChartsOption = {
    // Global text style
    textStyle: {
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        color: '#a0a0a0',
    },

    // Title style
    title: {
        textStyle: {
            color: '#00f3ff',
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 'bold',
        },
        subtextStyle: {
            color: '#666',
            fontFamily: '"JetBrains Mono", monospace',
        },
    },

    // Color palette for series
    color: [
        '#00f3ff', // Neon Cyan
        '#ff00ff', // Magenta
        '#bf00ff', // Purple
        '#ff0080', // Pink
        '#f0ff00', // Yellow
        '#00ff88', // Green
        '#ff6600', // Orange
    ],

    // Background
    backgroundColor: 'transparent',

    // Grid
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
    },

    // X Axis
    xAxis: {
        axisLine: {
            lineStyle: {
                color: '#00f3ff',
                opacity: 0.5,
            },
        },
        axisTick: {
            lineStyle: {
                color: '#00f3ff',
                opacity: 0.3,
            },
        },
        axisLabel: {
            color: '#888',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
        },
        splitLine: {
            lineStyle: {
                color: '#00f3ff',
                opacity: 0.1,
            },
        },
    },

    // Y Axis
    yAxis: {
        axisLine: {
            lineStyle: {
                color: '#00f3ff',
                opacity: 0.5,
            },
        },
        axisTick: {
            lineStyle: {
                color: '#00f3ff',
                opacity: 0.3,
            },
        },
        axisLabel: {
            color: '#888',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 11,
        },
        splitLine: {
            lineStyle: {
                color: '#00f3ff',
                opacity: 0.1,
                type: 'dashed',
            },
        },
    },

    // Tooltip
    tooltip: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        borderColor: '#00f3ff',
        borderWidth: 1,
        textStyle: {
            color: '#fff',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 12,
        },
        extraCssText: 'box-shadow: 0 0 15px #00f3ff;',
    },

    // Legend
    legend: {
        textStyle: {
            color: '#a0a0a0',
            fontFamily: '"JetBrains Mono", monospace',
        },
    },
}

/**
 * Get bar chart specific options merged with theme
 */
export function getBarChartOptions(
    data: { name: string; value: number }[],
    title?: string
): EChartsOption {
    return {
        ...cyberpunkTheme,
        title: {
            ...cyberpunkTheme.title,
            text: title,
        },
        xAxis: {
            ...cyberpunkTheme.xAxis,
            type: 'category',
            data: data.map(d => d.name),
        },
        yAxis: {
            ...cyberpunkTheme.yAxis,
            type: 'value',
        },
        series: [
            {
                type: 'bar',
                data: data.map(d => d.value),
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: '#00f3ff' },
                            { offset: 1, color: '#0088aa' },
                        ],
                    },
                    shadowColor: '#00f3ff',
                    shadowBlur: 10,
                },
                emphasis: {
                    itemStyle: {
                        color: '#ff00ff',
                        shadowColor: '#ff00ff',
                        shadowBlur: 20,
                    },
                },
            },
        ],
    }
}

/**
 * Get line chart specific options merged with theme
 */
export function getLineChartOptions(
    data: { name: string; value: number }[],
    title?: string
): EChartsOption {
    return {
        ...cyberpunkTheme,
        title: {
            ...cyberpunkTheme.title,
            text: title,
        },
        xAxis: {
            ...cyberpunkTheme.xAxis,
            type: 'category',
            data: data.map(d => d.name),
        },
        yAxis: {
            ...cyberpunkTheme.yAxis,
            type: 'value',
        },
        series: [
            {
                type: 'line',
                data: data.map(d => d.value),
                smooth: true,
                lineStyle: {
                    color: '#00f3ff',
                    width: 3,
                    shadowColor: '#00f3ff',
                    shadowBlur: 10,
                },
                itemStyle: {
                    color: '#00f3ff',
                    borderColor: '#fff',
                    borderWidth: 2,
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(0, 243, 255, 0.3)' },
                            { offset: 1, color: 'rgba(0, 243, 255, 0)' },
                        ],
                    },
                },
            },
        ],
    }
}

/**
 * Get pie chart specific options merged with theme
 */
export function getPieChartOptions(
    data: { name: string; value: number }[],
    title?: string
): EChartsOption {
    return {
        ...cyberpunkTheme,
        title: {
            ...cyberpunkTheme.title,
            text: title,
        },
        series: [
            {
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderColor: '#0a0a0f',
                    borderWidth: 2,
                    shadowBlur: 20,
                    shadowColor: 'rgba(0, 243, 255, 0.5)',
                },
                label: {
                    color: '#a0a0a0',
                    fontFamily: '"JetBrains Mono", monospace',
                },
                emphasis: {
                    label: {
                        show: true,
                        fontWeight: 'bold',
                        color: '#00f3ff',
                    },
                    itemStyle: {
                        shadowBlur: 30,
                        shadowColor: '#00f3ff',
                    },
                },
                data: data.map((d, i) => ({
                    ...d,
                    itemStyle: {
                        color: (cyberpunkTheme.color as string[])[i % 7],
                    },
                })),
            },
        ],
    }
}
