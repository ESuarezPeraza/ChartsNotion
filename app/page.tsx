'use client'

import { useState, useEffect } from 'react'
import { Plus, BarChart3, LineChart, PieChart, TrendingUp, ExternalLink, Trash2, Copy, Check, Settings, Pencil } from 'lucide-react'
import Link from 'next/link'
import { getSavedCharts, deleteChart, type SavedChart } from '@/lib/storage'

const chartTypeIcons: Record<string, React.ReactNode> = {
    bar: <BarChart3 className="w-6 h-6" />,
    line: <LineChart className="w-6 h-6" />,
    pie: <PieChart className="w-6 h-6" />,
    area: <TrendingUp className="w-6 h-6" />,
}

const chartTypeLabels: Record<string, string> = {
    bar: 'Barras',
    line: 'Línea',
    pie: 'Pastel',
    area: 'Área',
}

export default function HomePage() {
    const [charts, setCharts] = useState<SavedChart[]>([])
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        setCharts(getSavedCharts())
    }, [])

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este chart?')) {
            deleteChart(id)
            setCharts(getSavedCharts())
        }
    }

    const handleCopy = async (url: string, id: string) => {
        await navigator.clipboard.writeText(url)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Notion Charts</h1>
                                <p className="text-sm text-gray-500">Visualiza tus datos de Notion</p>
                            </div>
                        </div>
                        <Link
                            href="/create"
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Nuevo Chart
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {charts.length === 0 ? (
                    // Empty State
                    <div className="text-center py-20">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mx-auto mb-6">
                            <BarChart3 className="w-10 h-10 text-primary-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">No tienes charts guardados</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Crea tu primer chart para visualizar datos de tus bases de Notion y embédalos donde quieras.
                        </p>
                        <Link
                            href="/create"
                            className="btn-primary inline-flex items-center gap-2 text-lg px-6 py-3"
                        >
                            <Plus className="w-5 h-5" />
                            Crear mi primer Chart
                        </Link>
                    </div>
                ) : (
                    // Charts Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {charts.map((chart) => (
                            <div
                                key={chart.id}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group overflow-hidden"
                            >
                                {/* Chart Preview Header */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${chart.config.chartType === 'bar' ? 'bg-blue-100 text-blue-600' :
                                                chart.config.chartType === 'line' ? 'bg-green-100 text-green-600' :
                                                    chart.config.chartType === 'pie' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-orange-100 text-orange-600'
                                                }`}>
                                                {chartTypeIcons[chart.config.chartType]}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 line-clamp-1">
                                                    {chart.name || chart.config.title || 'Sin nombre'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {chartTypeLabels[chart.config.chartType]}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart Info */}
                                <div className="p-4 space-y-3">
                                    <div className="text-sm">
                                        <span className="text-gray-500">Eje X:</span>{' '}
                                        <span className="font-medium text-gray-700">{chart.config.xProperty}</span>
                                    </div>
                                    {chart.config.yProperty && (
                                        <div className="text-sm">
                                            <span className="text-gray-500">Eje Y:</span>{' '}
                                            <span className="font-medium text-gray-700">{chart.config.yProperty}</span>
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400">
                                        Creado: {formatDate(chart.createdAt)}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 pt-0 flex gap-2">
                                    <button
                                        onClick={() => handleCopy(chart.embedUrl, chart.id)}
                                        className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1.5"
                                    >
                                        {copiedId === chart.id ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copiado
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copiar URL
                                            </>
                                        )}
                                    </button>
                                    <a
                                        href={chart.embedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary p-2"
                                        title="Ver chart"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                    <Link
                                        href={`/create?edit=${chart.id}`}
                                        className="btn-secondary p-2 text-blue-600 hover:bg-blue-50 hover:border-blue-200"
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(chart.id)}
                                        className="btn-secondary p-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add New Card */}
                        <Link
                            href="/create"
                            className="bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/50 transition-all flex flex-col items-center justify-center p-8 min-h-[240px] group"
                        >
                            <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center mb-4 transition-colors">
                                <Plus className="w-7 h-7 text-gray-400 group-hover:text-primary-600 transition-colors" />
                            </div>
                            <span className="text-gray-500 group-hover:text-primary-600 font-medium transition-colors">
                                Nuevo Chart
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </main>
    )
}
