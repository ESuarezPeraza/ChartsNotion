'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, LineChart, PieChart, TrendingUp, Play, Copy, ExternalLink, Check, Database, ChevronRight, RefreshCw, ChevronDown, Settings, Palette, Grid3X3, Type, ArrowUpDown, ArrowUpAZ, GripVertical, Eye, EyeOff, ChevronsUp, ChevronsDown, MoveUp, MoveDown, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { saveChart } from '@/lib/storage'

const BaseChart = dynamic(() => import('@/components/charts/BaseChart'), {
    ssr: false,
    loading: () => (
        <div className="h-[350px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    )
})

type ChartType = 'bar' | 'line' | 'pie' | 'area'

interface Property {
    name: string
    type: string
    isNumeric: boolean
    isCategory: boolean
    isDate: boolean
    isText: boolean
}

interface ChartConfig {
    databaseId: string
    xProperty: string
    yProperty: string
    chartType: ChartType
    aggregation: 'sum' | 'count' | 'average'
    title: string
}

interface AdvancedOptions {
    colorPalette: string
    customColors: string[]
    showLegend: boolean
    showGrid: boolean
    showLabels: boolean
    // Line/Area options
    smooth: number
    lineWidth: number
    symbolSize: number
    showSymbols: boolean
    // Bar options
    barRadius: number
    barMaxWidth: number
    // Pie options
    pieInnerRadius: number
    pieBorderWidth: number
    // General
    chartHeight: number
    fontSize: number
    showXAxis: boolean
    showYAxis: boolean
    sortBy: 'none' | 'x' | 'y' | 'manual'
    sortOrder: 'asc' | 'desc'
    limitResults: number
    // Granular options
    manualOrder: string[]
    excludedCategories: string[]
    categoryColors: Record<string, string>
}

// Paletas de colores profesionales
const colorPalettes: Record<string, { name: string; colors: string[] }> = {
    indigo: { name: 'Indigo', colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'] },
    ocean: { name: 'Océano', colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16'] },
    sunset: { name: 'Atardecer', colors: ['#f97316', '#fb923c', '#fbbf24', '#facc15', '#a3e635', '#4ade80'] },
    berry: { name: 'Berries', colors: ['#e11d48', '#db2777', '#c026d3', '#9333ea', '#7c3aed', '#6366f1'] },
    earth: { name: 'Tierra', colors: ['#78716c', '#a8a29e', '#d6d3d1', '#fbbf24', '#f59e0b', '#d97706'] },
    mono: { name: 'Monocromático', colors: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'] },
    rainbow: { name: 'Arcoíris', colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'] },
    pastel: { name: 'Pastel', colors: ['#fda4af', '#fdba74', '#fde047', '#86efac', '#7dd3fc', '#c4b5fd'] },
}

export default function CreatePage() {
    const router = useRouter()
    const [chartName, setChartName] = useState('')
    const [saved, setSaved] = useState(false)
    const [config, setConfig] = useState<ChartConfig>({
        databaseId: '',
        xProperty: '',
        yProperty: '',
        chartType: 'bar',
        aggregation: 'count',
        title: ''
    })
    const [advanced, setAdvanced] = useState<AdvancedOptions>({
        colorPalette: 'indigo',
        customColors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'],
        showLegend: false,
        showGrid: true,
        showLabels: true,
        // Line/Area
        smooth: 0.5,
        lineWidth: 3,
        symbolSize: 8,
        showSymbols: true,
        // Bar
        barRadius: 6,
        barMaxWidth: 60,
        // Pie
        pieInnerRadius: 45,
        pieBorderWidth: 2,
        // General
        chartHeight: 350,
        fontSize: 12,
        showXAxis: true,
        showYAxis: true,
        sortBy: 'none',
        sortOrder: 'desc',
        limitResults: 0,
        manualOrder: [],
        excludedCategories: [],
        categoryColors: {},
    })
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [properties, setProperties] = useState<Property[]>([])
    const [isLoadingSchema, setIsLoadingSchema] = useState(false)
    const [schemaError, setSchemaError] = useState<string | null>(null)
    const [previewData, setPreviewData] = useState<{ name: string; value: number }[] | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [embedUrl, setEmbedUrl] = useState<string>('')
    const [copied, setCopied] = useState(false)

    // Lista de todas las categorías disponibles (para la UI de ordenamiento)
    const [availableCategories, setAvailableCategories] = useState<string[]>([])

    const chartTypes: { type: ChartType; icon: React.ReactNode; label: string }[] = [
        { type: 'bar', icon: <BarChart3 className="w-5 h-5" />, label: 'Barras' },
        { type: 'line', icon: <LineChart className="w-5 h-5" />, label: 'Líneas' },
        { type: 'pie', icon: <PieChart className="w-5 h-5" />, label: 'Pastel' },
        { type: 'area', icon: <TrendingUp className="w-5 h-5" />, label: 'Área' },
    ]

    const loadSchema = async () => {
        if (!config.databaseId) {
            setSchemaError('Ingresa el ID de la base de datos')
            return
        }

        setIsLoadingSchema(true)
        setSchemaError(null)
        setProperties([])
        setConfig(prev => ({ ...prev, xProperty: '', yProperty: '' }))

        try {
            const res = await fetch(`/api/notion/schema/${config.databaseId}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Error al cargar propiedades')
            }

            setProperties(data.properties)
        } catch (err) {
            setSchemaError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setIsLoadingSchema(false)
        }
    }

    const handlePreview = async () => {
        if (!config.databaseId || !config.xProperty) {
            setError('El ID de la base de datos y la propiedad X son requeridos')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                x: config.xProperty,
                ...(config.yProperty && { y: config.yProperty }),
                agg: config.aggregation,
            })

            const res = await fetch(`/api/notion/${config.databaseId}?${params}`)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Error al obtener datos')
            }

            let processedData = data.data as { name: string; value: number }[]

            // Update available categories for manual sorting UI if needed
            // Only update if list is vastly different or empty
            const currentCategories = processedData.map(d => d.name)

            // If manual sort is empty, initialize it with current order
            if (advanced.manualOrder.length === 0) {
                setAdvanced(prev => ({ ...prev, manualOrder: currentCategories }))
            } else {
                // If there are new categories not in manualOrder, append them
                const newCats = currentCategories.filter(c => !advanced.manualOrder.includes(c))
                if (newCats.length > 0) {
                    setAdvanced(prev => ({ ...prev, manualOrder: [...prev.manualOrder, ...newCats] }))
                }
            }
            setAvailableCategories(currentCategories)

            // Filtering
            processedData = processedData.filter(d => !advanced.excludedCategories.includes(d.name))

            // Sorting logic
            if (advanced.sortBy === 'manual') {
                processedData.sort((a, b) => {
                    const idxA = advanced.manualOrder.indexOf(a.name)
                    const idxB = advanced.manualOrder.indexOf(b.name)
                    // Retrieve index, if not found (e.g. dynamic new data), put at end
                    const aPos = idxA === -1 ? 9999 : idxA
                    const bPos = idxB === -1 ? 9999 : idxB
                    return aPos - bPos
                })
            } else if (advanced.sortBy !== 'none') {
                processedData.sort((a, b) => {
                    let valA: any = advanced.sortBy === 'x' ? a.name : a.value
                    let valB: any = advanced.sortBy === 'x' ? b.name : b.value

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

                        if (advanced.sortBy === 'x' && !isNaN(numA) && !isNaN(numB)) {
                            valA = numA
                            valB = numB
                        }
                    }

                    if (valA < valB) return advanced.sortOrder === 'asc' ? -1 : 1
                    if (valA > valB) return advanced.sortOrder === 'asc' ? 1 : -1
                    return 0
                })
            }

            // Limit results
            if (advanced.limitResults > 0) {
                processedData = processedData.slice(0, advanced.limitResults)
            }

            setPreviewData(processedData)

            const baseUrl = window.location.origin
            const chartParams = new URLSearchParams({
                db: config.databaseId,
                x: config.xProperty,
                ...(config.yProperty && { y: config.yProperty }),
                agg: config.aggregation,
                ...(config.title && { title: config.title }),
                colors: advanced.colorPalette === 'custom'
                    ? advanced.customColors.join(',')
                    : colorPalettes[advanced.colorPalette].colors.join(','),
                legend: String(advanced.showLegend),
                grid: String(advanced.showGrid),
                labels: String(advanced.showLabels),
                smooth: String(advanced.smooth),
                lineWidth: String(advanced.lineWidth),
                symbolSize: String(advanced.symbolSize),
                showSymbols: String(advanced.showSymbols),
                barRadius: String(advanced.barRadius),
                barMaxWidth: String(advanced.barMaxWidth),
                pieInnerRadius: String(advanced.pieInnerRadius),
                pieBorderWidth: String(advanced.pieBorderWidth),
                sortBy: advanced.sortBy,
                sortOrder: advanced.sortOrder,
                fontSize: String(advanced.fontSize),
                showXAxis: String(advanced.showXAxis),
                showYAxis: String(advanced.showYAxis),
                manualOrder: advanced.manualOrder.join(','),
                excluded: advanced.excludedCategories.join(','),
                catColors: JSON.stringify(advanced.categoryColors)
            })

            setEmbedUrl(`${baseUrl}/charts/${config.chartType}?${chartParams}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
            setPreviewData(null)
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(embedUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSave = () => {
        if (!embedUrl) return

        saveChart({
            name: chartName || config.title || 'Sin nombre',
            embedUrl,
            config: {
                databaseId: config.databaseId,
                xProperty: config.xProperty,
                yProperty: config.yProperty,
                chartType: config.chartType,
                aggregation: config.aggregation,
                title: config.title,
            },
            advanced,
        })
        setSaved(true)
        setTimeout(() => {
            router.push('/')
        }, 1000)
    }

    const getChartOptions = () => {
        if (!previewData) return {}

        const getCategoryColor = (name: string, index: number) => {
            // 1. Check specific category color
            if (advanced.categoryColors[name]) return advanced.categoryColors[name]

            // 2. Check palette
            const palette = advanced.colorPalette === 'custom'
                ? advanced.customColors
                : colorPalettes[advanced.colorPalette].colors

            return palette[index % palette.length]
        }

        const baseOptions = {
            backgroundColor: 'transparent',
            textStyle: { fontFamily: 'Inter, sans-serif', color: '#374151', fontSize: advanced.fontSize },
            tooltip: {
                backgroundColor: '#fff',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                textStyle: { color: '#374151', fontFamily: 'Inter, sans-serif', fontSize: advanced.fontSize },
                extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
            },
            title: config.title ? {
                text: config.title,
                textStyle: { color: '#111827', fontWeight: 600, fontSize: advanced.fontSize + 4 },
            } : undefined,
            legend: advanced.showLegend ? {
                show: true,
                bottom: 0,
                textStyle: { color: '#6b7280', fontSize: advanced.fontSize - 1 },
            } : { show: false },
        }

        if (config.chartType === 'pie') {
            return {
                ...baseOptions,
                series: [{
                    type: 'pie',
                    radius: [`${advanced.pieInnerRadius}%`, '75%'],
                    center: ['50%', advanced.showLegend ? '45%' : '55%'],
                    data: previewData.map((d, i) => ({
                        ...d,
                        itemStyle: { color: getCategoryColor(d.name, i) },
                    })),
                    label: advanced.showLabels ? {
                        color: '#374151',
                        fontSize: advanced.fontSize,
                        formatter: '{b}: {c} ({d}%)'
                    } : { show: false },
                    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
                    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: advanced.pieBorderWidth },
                }],
            }
        }

        return {
            ...baseOptions,
            grid: {
                left: '3%',
                right: '4%',
                bottom: advanced.showLegend ? '15%' : '8%',
                top: config.title ? '18%' : '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                show: advanced.showXAxis,
                data: previewData.map(d => d.name),
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280', fontSize: advanced.fontSize - 1 },
                axisTick: { show: false },
            },
            yAxis: {
                type: 'value',
                show: advanced.showYAxis,
                axisLine: { show: false },
                splitLine: advanced.showGrid ? {
                    lineStyle: { color: '#f3f4f6', type: 'dashed' }
                } : { show: false },
                axisLabel: { color: '#6b7280', fontSize: advanced.fontSize - 1 },
            },
            series: [{
                name: config.xProperty,
                type: config.chartType === 'area' ? 'line' : config.chartType,
                data: previewData.map((d, i) => ({
                    value: d.value,
                    itemStyle: { color: getCategoryColor(d.name, i) }
                })),
                ...(config.chartType === 'bar' && {
                    itemStyle: {
                        borderRadius: [advanced.barRadius, advanced.barRadius, 0, 0],
                    },
                    barMaxWidth: advanced.barMaxWidth,
                    label: advanced.showLabels ? {
                        show: true,
                        position: 'top',
                        color: '#6b7280',
                        fontSize: advanced.fontSize - 2,
                    } : { show: false },
                }),
                ...(config.chartType === 'line' || config.chartType === 'area' ? {
                    smooth: advanced.smooth,
                    lineStyle: { width: advanced.lineWidth, color: getCategoryColor(config.xProperty, 0) },
                    symbol: advanced.showSymbols ? 'circle' : 'none',
                    symbolSize: advanced.symbolSize,
                    itemStyle: { color: getCategoryColor(config.xProperty, 0) },
                    areaStyle: config.chartType === 'area' ? {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: getCategoryColor(config.xProperty, 0) + '40' },
                                { offset: 1, color: getCategoryColor(config.xProperty, 0) + '05' }
                            ]
                        },
                    } : undefined,
                } : {}),
            }],
        }
    }

    const getPropertyTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            title: 'Título', rich_text: 'Texto', number: 'Número', select: 'Selección',
            multi_select: 'Multi-selección', date: 'Fecha', checkbox: 'Checkbox',
            status: 'Estado', formula: 'Fórmula', rollup: 'Rollup',
        }
        return labels[type] || type
    }

    const updateCustomColor = (index: number, color: string) => {
        const newColors = [...advanced.customColors]
        newColors[index] = color
        setAdvanced({ ...advanced, customColors: newColors })
    }

    // UI Helpers
    const manualMove = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...advanced.manualOrder]
        if (direction === 'up' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
        } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
        }
        setAdvanced({ ...advanced, manualOrder: newOrder })
    }

    const toggleExclusion = (name: string) => {
        const newExcluded = advanced.excludedCategories.includes(name)
            ? advanced.excludedCategories.filter(c => c !== name)
            : [...advanced.excludedCategories, name]
        setAdvanced({ ...advanced, excludedCategories: newExcluded })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Crear Chart</h1>
                                <p className="text-sm text-gray-500">Configura y guarda tu gráfico</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={chartName}
                                onChange={(e) => setChartName(e.target.value)}
                                placeholder="Nombre del chart..."
                                className="input w-48"
                            />
                            <button
                                onClick={handleSave}
                                disabled={!embedUrl || saved}
                                className="btn-primary flex items-center gap-2"
                            >
                                {saved ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Guardado
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Guardar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Sidebar - Configuración */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Panel Principal - Data */}
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary-600" />
                                Datos
                            </h2>
                            {/* ... (Same inputs as before up to Chart Type) ... */}
                            <div className="space-y-5">
                                {/* Database ID */}
                                <div>
                                    <label className="label">Base de Datos</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={config.databaseId}
                                            onChange={(e) => setConfig({ ...config, databaseId: e.target.value })}
                                            placeholder="ID de tu base de Notion"
                                            className="input font-mono text-sm flex-1"
                                        />
                                        <button
                                            onClick={loadSchema}
                                            disabled={isLoadingSchema || !config.databaseId}
                                            className="btn-secondary flex items-center gap-2"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isLoadingSchema ? 'animate-spin' : ''}`} />
                                            Cargar
                                        </button>
                                    </div>
                                    {schemaError && <p className="mt-2 text-sm text-red-600">{schemaError}</p>}
                                </div>

                                {properties.length > 0 && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                                        <Check className="w-4 h-4" />
                                        {properties.length} propiedades cargadas
                                    </div>
                                )}

                                {/* X Property */}
                                <div>
                                    <label className="label">Eje X (Categorías)</label>
                                    <div className="relative">
                                        <select
                                            value={config.xProperty}
                                            onChange={(e) => setConfig({ ...config, xProperty: e.target.value })}
                                            disabled={properties.length === 0}
                                            className="input appearance-none pr-10"
                                        >
                                            <option value="">{properties.length === 0 ? 'Carga las propiedades primero' : 'Selecciona...'}</option>
                                            {properties.map((prop) => (
                                                <option key={prop.name} value={prop.name}>
                                                    {prop.name} ({getPropertyTypeLabel(prop.type)})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Y Property */}
                                <div>
                                    <label className="label">Eje Y (Valores) <span className="text-gray-400 font-normal">- Opcional</span></label>
                                    <div className="relative">
                                        <select
                                            value={config.yProperty}
                                            onChange={(e) => setConfig({ ...config, yProperty: e.target.value })}
                                            disabled={properties.length === 0}
                                            className="input appearance-none pr-10"
                                        >
                                            <option value="">Usar conteo</option>
                                            {properties.filter(p => p.isNumeric).map((prop) => (
                                                <option key={prop.name} value={prop.name}>
                                                    {prop.name} ({getPropertyTypeLabel(prop.type)})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Chart Type */}
                                <div>
                                    <label className="label">Tipo de Gráfico</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {chartTypes.map(({ type, icon, label }) => (
                                            <button
                                                key={type}
                                                onClick={() => setConfig({ ...config, chartType: type })}
                                                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1.5 transition-all ${config.chartType === type
                                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {icon}
                                                <span className="text-xs font-medium">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Aggregation */}
                                <div>
                                    <label className="label">Agregación</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {([
                                            { value: 'count', label: 'Contar' },
                                            { value: 'sum', label: 'Sumar' },
                                            { value: 'average', label: 'Promedio' },
                                        ] as const).map(({ value, label }) => (
                                            <button
                                                key={value}
                                                onClick={() => setConfig({ ...config, aggregation: value })}
                                                className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${config.aggregation === value
                                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Chart Title */}
                                <div>
                                    <label className="label">Título del Gráfico <span className="text-gray-400 font-normal">- Opcional</span></label>
                                    <input
                                        type="text"
                                        value={config.title}
                                        onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                        placeholder="Ej: Ventas por Mes"
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Panel Avanzado - Styles & Sort */}
                        <div className="card">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full p-4 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-gray-500" />
                                    <span className="font-semibold text-gray-900">Opciones Avanzadas</span>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                            </button>

                            {showAdvanced && (
                                <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-4">
                                    {/* Sort Data */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label flex items-center gap-2">
                                                <ArrowUpDown className="w-4 h-4" />
                                                Ordenar por
                                            </label>
                                            <select
                                                value={advanced.sortBy}
                                                onChange={(e) => setAdvanced({ ...advanced, sortBy: e.target.value as any })}
                                                className="input text-sm"
                                            >
                                                <option value="none">Original</option>
                                                <option value="x">Categoría (X)</option>
                                                <option value="y">Valor (Y)</option>
                                                <option value="manual">Manual</option>
                                            </select>
                                        </div>
                                        {advanced.sortBy !== 'manual' && (
                                            <div>
                                                <label className="label flex items-center gap-2">
                                                    <ArrowUpAZ className="w-4 h-4" />
                                                    Dirección
                                                </label>
                                                <select
                                                    value={advanced.sortOrder}
                                                    onChange={(e) => setAdvanced({ ...advanced, sortOrder: e.target.value as any })}
                                                    className="input text-sm"
                                                >
                                                    <option value="asc">Ascendente</option>
                                                    <option value="desc">Descendente</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Manual Sort & Color & Filter List */}
                                    {advanced.sortBy === 'manual' && advanced.manualOrder.length > 0 && (
                                        <div className="border rounded-lg overflow-hidden bg-white">
                                            <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase flex justify-between">
                                                <span>Categoría</span>
                                                <span className="flex gap-4 mr-2">
                                                    <span>Color</span>
                                                    <span>Acciones</span>
                                                </span>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                                                {advanced.manualOrder.map((name, idx) => (
                                                    <div key={name} className="flex items-center justify-between p-2 hover:bg-gray-50 group">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <button
                                                                onClick={() => toggleExclusion(name)}
                                                                className={`p-1 rounded hover:bg-gray-200 ${advanced.excludedCategories.includes(name) ? 'text-gray-300' : 'text-primary-600'}`}
                                                                title={advanced.excludedCategories.includes(name) ? "Mostrar" : "Ocultar"}
                                                            >
                                                                {advanced.excludedCategories.includes(name) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                            <span className={`text-sm truncate ${advanced.excludedCategories.includes(name) ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                                {name}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="color"
                                                                value={advanced.categoryColors[name] || '#6366f1'}
                                                                onChange={(e) => setAdvanced({ ...advanced, categoryColors: { ...advanced.categoryColors, [name]: e.target.value } })}
                                                                className="w-6 h-6 rounded border-0 p-0 cursor-pointer bg-transparent"
                                                                title="Color específico"
                                                            />
                                                            <div className="flex flex-col gap-0.5">
                                                                <button
                                                                    onClick={() => manualMove(idx, 'up')}
                                                                    disabled={idx === 0}
                                                                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                                                                >
                                                                    <MoveUp className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => manualMove(idx, 'down')}
                                                                    disabled={idx === advanced.manualOrder.length - 1}
                                                                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                                                                >
                                                                    <MoveDown className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Color Palette (Show only if not manual, or maybe allow overriding?) */}
                                    {/* If manual mode, user typically sets colors per item, but we can keep palette for defaults */}
                                    {advanced.sortBy !== 'manual' && (
                                        <div>
                                            <label className="label flex items-center gap-2">
                                                <Palette className="w-4 h-4" />
                                                Paleta de Colores
                                            </label>
                                            <div className="grid grid-cols-4 gap-2 mb-3">
                                                {Object.entries(colorPalettes).map(([key, { name, colors }]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setAdvanced({ ...advanced, colorPalette: key })}
                                                        className={`p-2 rounded-lg border-2 transition-all ${advanced.colorPalette === key
                                                            ? 'border-primary-600 bg-primary-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                        title={name}
                                                    >
                                                        <div className="flex gap-0.5 justify-center mb-1">
                                                            {colors.slice(0, 4).map((color, i) => (
                                                                <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-gray-600">{name}</span>
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setAdvanced({ ...advanced, colorPalette: 'custom' })}
                                                    className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${advanced.colorPalette === 'custom'
                                                        ? 'border-primary-600 bg-primary-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex gap-0.5">
                                                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-blue-500" />
                                                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-purple-500" />
                                                    </div>
                                                    <span className="text-xs text-gray-600">Personalizado</span>
                                                </button>
                                            </div>
                                            {/* Custom Colors Inputs */}
                                            {advanced.colorPalette === 'custom' && (
                                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Elige tus colores (Cíclicos)</label>
                                                    <div className="grid grid-cols-6 gap-2">
                                                        {advanced.customColors.map((color, i) => (
                                                            <input
                                                                key={i}
                                                                type="color"
                                                                value={color}
                                                                onChange={(e) => updateCustomColor(i, e.target.value)}
                                                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                                title={`Color ${i + 1}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Toggles */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <ToggleOption label="Leyenda" checked={advanced.showLegend} onChange={(v) => setAdvanced({ ...advanced, showLegend: v })} />
                                        <ToggleOption label="Grid" checked={advanced.showGrid} onChange={(v) => setAdvanced({ ...advanced, showGrid: v })} />
                                        <ToggleOption label="Etiquetas" checked={advanced.showLabels} onChange={(v) => setAdvanced({ ...advanced, showLabels: v })} />
                                        {config.chartType !== 'pie' && (
                                            <>
                                                <ToggleOption label="Eje X" checked={advanced.showXAxis} onChange={(v) => setAdvanced({ ...advanced, showXAxis: v })} />
                                                <ToggleOption label="Eje Y" checked={advanced.showYAxis} onChange={(v) => setAdvanced({ ...advanced, showYAxis: v })} />
                                            </>
                                        )}
                                        {(config.chartType === 'line' || config.chartType === 'area') && (
                                            <ToggleOption label="Puntos" checked={advanced.showSymbols} onChange={(v) => setAdvanced({ ...advanced, showSymbols: v })} />
                                        )}
                                    </div>

                                    {/* General Sliders */}
                                    <div className="space-y-4">
                                        <SliderOption label="Altura del Gráfico" value={advanced.chartHeight} min={200} max={600} step={50} unit="px" onChange={(v) => setAdvanced({ ...advanced, chartHeight: v })} />
                                        <SliderOption label="Tamaño de Fuente" value={advanced.fontSize} min={10} max={18} onChange={(v) => setAdvanced({ ...advanced, fontSize: v })} />
                                    </div>

                                    {/* Chart-specific options */}
                                    {(config.chartType === 'line' || config.chartType === 'area') && (
                                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h4 className="text-sm font-semibold text-blue-800">Opciones de Línea/Área</h4>
                                            <SliderOption label="Grosor de Línea" value={advanced.lineWidth} min={1} max={8} unit="px" onChange={(v) => setAdvanced({ ...advanced, lineWidth: v })} />
                                            <SliderOption label="Suavidad de Curva" value={Math.round(advanced.smooth * 100)} min={0} max={100} unit="%" onChange={(v) => setAdvanced({ ...advanced, smooth: v / 100 })} />
                                            {advanced.showSymbols && (
                                                <SliderOption label="Tamaño de Puntos" value={advanced.symbolSize} min={4} max={20} onChange={(v) => setAdvanced({ ...advanced, symbolSize: v })} />
                                            )}
                                        </div>
                                    )}

                                    {config.chartType === 'bar' && (
                                        <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                            <h4 className="text-sm font-semibold text-green-800">Opciones de Barras</h4>
                                            <SliderOption label="Radio de Esquinas" value={advanced.barRadius} min={0} max={20} onChange={(v) => setAdvanced({ ...advanced, barRadius: v })} />
                                            <SliderOption label="Ancho Máximo" value={advanced.barMaxWidth} min={20} max={100} unit="px" onChange={(v) => setAdvanced({ ...advanced, barMaxWidth: v })} />
                                        </div>
                                    )}

                                    {config.chartType === 'pie' && (
                                        <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                            <h4 className="text-sm font-semibold text-purple-800">Opciones de Pastel</h4>
                                            <SliderOption label="Radio Interior (Dona)" value={advanced.pieInnerRadius} min={0} max={70} unit="%" onChange={(v) => setAdvanced({ ...advanced, pieInnerRadius: v })} />
                                            <SliderOption label="Grosor del Borde" value={advanced.pieBorderWidth} min={0} max={8} unit="px" onChange={(v) => setAdvanced({ ...advanced, pieBorderWidth: v })} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handlePreview}
                            disabled={isLoading || !config.databaseId || !config.xProperty}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Aplicar Cambios
                                </>
                            )}
                        </button>
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Vista Previa</h2>

                            {previewData ? (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <BaseChart option={getChartOptions()} height={advanced.chartHeight} />
                                    </div>

                                    {embedUrl && (
                                        <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-medium text-primary-900">URL para Embed</label>
                                                <div className="flex gap-2">
                                                    <button onClick={copyToClipboard} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                                                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                        {copied ? 'Copiado!' : 'Copiar'}
                                                    </button>
                                                    <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3">
                                                        <ExternalLink className="w-4 h-4" />
                                                        Abrir
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-600 break-all border border-primary-200">
                                                {embedUrl}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                                    <div className="text-center">
                                        <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium">Tu gráfico aparecerá aquí</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function ToggleOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <span className="text-sm text-gray-700">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-5' : 'left-1'}`} />
            </button>
        </label>
    )
}

function SliderOption({ label, value, min, max, step = 1, unit = '', onChange }: {
    label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void
}) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">{label}</span>
                <span className="text-gray-500">{value}{unit}</span>
            </div>
            <input
                type="range"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
        </div>
    )
}
