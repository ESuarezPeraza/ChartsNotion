'use client'

import { useState, useMemo } from 'react'
import type { ContributionEntry } from '@/types'

interface ContributionGraphProps {
    entries: ContributionEntry[]
    title?: string
    darkMode?: boolean
}

// GitHub-style green palette
const COLORS_LIGHT = {
    empty: '#ebedf0',
    level1: '#9be9a8',
    level2: '#40c463',
    level3: '#30a14e',
    level4: '#216e39',
}

const COLORS_DARK = {
    empty: '#161b22',
    level1: '#0e4429',
    level2: '#006d32',
    level3: '#26a641',
    level4: '#39d353',
}

const DAYS_LABELS = ['', 'Lun', '', 'Mié', '', 'Vie', '']
const MONTHS_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const CELL_SIZE = 13
const CELL_GAP = 3
const TOTAL_CELL = CELL_SIZE + CELL_GAP
const LABEL_WIDTH = 32
const TOP_PADDING = 20

/**
 * GitHub-style contribution graph rendered with SVG
 */
export default function ContributionGraph({ entries, title, darkMode = false }: ContributionGraphProps) {
    const [tooltip, setTooltip] = useState<{
        x: number
        y: number
        date: string
        subject: string
        description: string
    } | null>(null)

    const colors = darkMode ? COLORS_DARK : COLORS_LIGHT

    // Build date map for quick lookups
    const dateMap = useMemo(() => {
        const map = new Map<string, ContributionEntry[]>()
        for (const entry of entries) {
            const key = entry.date
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(entry)
        }
        return map
    }, [entries])

    // Generate grid: last 52 weeks + current partial week
    const { weeks, monthLabels } = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Start from the Sunday of 52 weeks ago
        const start = new Date(today)
        start.setDate(today.getDate() - today.getDay() - 52 * 7)

        const weeks: Array<Array<{ date: Date; dateStr: string; count: number }>> = []
        const monthLabels: Array<{ label: string; col: number }> = []

        let currentDate = new Date(start)
        let lastMonth = -1

        while (currentDate <= today) {
            const weekIndex = weeks.length === 0 || weeks[weeks.length - 1].length === 7
                ? (weeks.push([]), weeks.length - 1)
                : weeks.length - 1

            const dateStr = currentDate.toISOString().split('T')[0]
            const entriesForDate = dateMap.get(dateStr) || []

            weeks[weekIndex].push({
                date: new Date(currentDate),
                dateStr,
                count: entriesForDate.length,
            })

            // Track month labels
            const month = currentDate.getMonth()
            if (month !== lastMonth) {
                monthLabels.push({
                    label: MONTHS_LABELS[month],
                    col: weekIndex,
                })
                lastMonth = month
            }

            currentDate.setDate(currentDate.getDate() + 1)
        }

        return { weeks, monthLabels }
    }, [dateMap])

    const svgWidth = LABEL_WIDTH + weeks.length * TOTAL_CELL + 10
    const svgHeight = TOP_PADDING + 7 * TOTAL_CELL + 10

    const getColor = (count: number) => {
        if (count === 0) return colors.empty
        if (count === 1) return colors.level1
        if (count === 2) return colors.level2
        if (count === 3) return colors.level3
        return colors.level4
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    const totalContributions = entries.length

    return (
        <div className="relative w-full" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
            {/* Title */}
            {title && (
                <h3
                    style={{
                        color: darkMode ? '#ffffffcf' : '#37352f',
                        fontWeight: 600,
                        fontSize: 16,
                        marginBottom: 12,
                        textAlign: 'center',
                    }}
                >
                    {title}
                </h3>
            )}

            {/* Summary */}
            <p
                style={{
                    color: darkMode ? '#ffffff73' : '#6b7280',
                    fontSize: 13,
                    marginBottom: 12,
                }}
            >
                {totalContributions} contribuciones en el último año
            </p>

            {/* SVG Graph */}
            <div className="overflow-x-auto">
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    style={{ display: 'block' }}
                >
                    {/* Month labels */}
                    {monthLabels.map((m, i) => (
                        <text
                            key={i}
                            x={LABEL_WIDTH + m.col * TOTAL_CELL}
                            y={12}
                            fontSize={10}
                            fill={darkMode ? '#ffffff73' : '#6b7280'}
                            fontFamily="Inter, -apple-system, sans-serif"
                        >
                            {m.label}
                        </text>
                    ))}

                    {/* Day labels */}
                    {DAYS_LABELS.map((label, i) =>
                        label ? (
                            <text
                                key={i}
                                x={0}
                                y={TOP_PADDING + i * TOTAL_CELL + CELL_SIZE - 2}
                                fontSize={10}
                                fill={darkMode ? '#ffffff73' : '#6b7280'}
                                fontFamily="Inter, -apple-system, sans-serif"
                            >
                                {label}
                            </text>
                        ) : null
                    )}

                    {/* Cells */}
                    {weeks.map((week, wi) =>
                        week.map((day, di) => (
                            <rect
                                key={`${wi}-${di}`}
                                x={LABEL_WIDTH + wi * TOTAL_CELL}
                                y={TOP_PADDING + di * TOTAL_CELL}
                                width={CELL_SIZE}
                                height={CELL_SIZE}
                                rx={2}
                                ry={2}
                                fill={getColor(day.count)}
                                style={{ cursor: day.count > 0 ? 'pointer' : 'default', transition: 'fill 0.1s' }}
                                onMouseEnter={(e) => {
                                    if (day.count > 0) {
                                        const entriesForDay = dateMap.get(day.dateStr) || []
                                        const entry = entriesForDay[0]
                                        const rect = (e.target as SVGRectElement).getBoundingClientRect()
                                        setTooltip({
                                            x: rect.left + rect.width / 2,
                                            y: rect.top,
                                            date: day.dateStr,
                                            subject: entry?.subject || '',
                                            description: entry?.description || '',
                                        })
                                    }
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            />
                        ))
                    )}
                </svg>
            </div>

            {/* Legend */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                    marginTop: 8,
                    fontSize: 11,
                    color: darkMode ? '#ffffff73' : '#6b7280',
                }}
            >
                <span>Menos</span>
                {[colors.empty, colors.level1, colors.level2, colors.level3, colors.level4].map((color, i) => (
                    <svg key={i} width={CELL_SIZE} height={CELL_SIZE}>
                        <rect width={CELL_SIZE} height={CELL_SIZE} rx={2} ry={2} fill={color} />
                    </svg>
                ))}
                <span>Más</span>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    style={{
                        position: 'fixed',
                        left: tooltip.x,
                        top: tooltip.y - 8,
                        transform: 'translate(-50%, -100%)',
                        padding: '8px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        lineHeight: 1.5,
                        maxWidth: 280,
                        zIndex: 1000,
                        pointerEvents: 'none',
                        backgroundColor: darkMode ? '#252525' : '#fff',
                        color: darkMode ? '#ffffffcf' : '#37352f',
                        border: `1px solid ${darkMode ? '#ffffff1a' : '#e5e7eb'}`,
                        boxShadow: darkMode
                            ? '0 4px 12px rgba(0,0,0,0.4)'
                            : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                    }}
                >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {formatDate(tooltip.date)}
                    </div>
                    <div style={{ fontWeight: 500, color: darkMode ? '#39d353' : '#216e39' }}>
                        {tooltip.subject}
                    </div>
                    {tooltip.description && (
                        <div style={{ color: darkMode ? '#ffffff73' : '#6b7280', marginTop: 2 }}>
                            {tooltip.description}
                        </div>
                    )}
                    {/* Arrow */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -5,
                            left: '50%',
                            transform: 'translateX(-50%) rotate(45deg)',
                            width: 10,
                            height: 10,
                            backgroundColor: darkMode ? '#252525' : '#fff',
                            borderRight: `1px solid ${darkMode ? '#ffffff1a' : '#e5e7eb'}`,
                            borderBottom: `1px solid ${darkMode ? '#ffffff1a' : '#e5e7eb'}`,
                        }}
                    />
                </div>
            )}
        </div>
    )
}
