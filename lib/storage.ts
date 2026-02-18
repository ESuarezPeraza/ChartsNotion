'use client'

export interface SavedChart {
    id: string
    name: string
    createdAt: string
    updatedAt: string
    embedUrl: string
    config: {
        databaseId: string
        xProperty: string
        yProperty: string
        chartType: 'bar' | 'line' | 'pie' | 'area' | 'contribution'
        aggregation: 'sum' | 'count' | 'average'
        title: string
    }
    advanced: Record<string, any>
}

const STORAGE_KEY = 'notion-charts-saved'

export function getSavedCharts(): SavedChart[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
}

export function saveChart(chart: Omit<SavedChart, 'id' | 'createdAt' | 'updatedAt'>): SavedChart {
    const charts = getSavedCharts()
    const newChart: SavedChart = {
        ...chart,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
    charts.push(newChart)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts))
    return newChart
}

export function updateChart(id: string, updates: Partial<Omit<SavedChart, 'id' | 'createdAt'>>): SavedChart | null {
    const charts = getSavedCharts()
    const index = charts.findIndex(c => c.id === id)
    if (index === -1) return null

    charts[index] = {
        ...charts[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts))
    return charts[index]
}

export function deleteChart(id: string): boolean {
    const charts = getSavedCharts()
    const filtered = charts.filter(c => c.id !== id)
    if (filtered.length === charts.length) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
}

export function getChartById(id: string): SavedChart | null {
    const charts = getSavedCharts()
    return charts.find(c => c.id === id) || null
}
