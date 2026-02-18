'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useContributionData } from '@/hooks/useContributionData'
import dynamic from 'next/dynamic'
import LoadingHUD from '@/components/ui/LoadingHUD'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { RefreshCw, Moon, Sun } from 'lucide-react'

const ContributionGraph = dynamic(() => import('@/components/charts/ContributionGraph'), {
    ssr: false,
    loading: () => <div style={{ height: 200 }} />,
})

export default function ContributionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <LoadingHUD message="CARGANDO..." />
            </div>
        }>
            <ContributionPageContent />
        </Suspense>
    )
}

function ContributionPageContent() {
    const searchParams = useSearchParams()

    // Get query parameters
    const databaseId = searchParams.get('db') || ''
    const dateProperty = searchParams.get('date') || ''
    const subjectProperty = searchParams.get('subject') || ''
    const descriptionProperty = searchParams.get('description') || ''
    const customTitle = searchParams.get('title') || undefined
    const bgColor = searchParams.get('bg') || 'transparent'

    // State
    const [darkMode, setDarkMode] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Fetch data
    const { entries, isLoading, isError, error, refresh } = useContributionData({
        databaseId,
        dateProperty,
        subjectProperty,
        descriptionProperty,
    })

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await refresh()
        setIsRefreshing(false)
    }

    // Validate required params
    if (!databaseId || !dateProperty || !subjectProperty || !descriptionProperty) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <ErrorDisplay
                    message="Missing required parameters: db, date, subject, description"
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

    return (
        <main
            className="min-h-screen p-6 relative transition-colors"
            style={{ backgroundColor: darkMode ? '#191919' : bgColor }}
        >
            {/* Floating Controls */}
            <div className="absolute top-3 right-3 flex gap-2 z-10">
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 rounded-md transition-all ${darkMode
                        ? 'bg-[#ffffff0d] hover:bg-[#ffffff1a] text-[#ffffffcf]'
                        : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-sm'
                        }`}
                    title="Actualizar datos"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`p-2 rounded-md transition-all ${darkMode
                        ? 'bg-[#ffffff0d] hover:bg-[#ffffff1a] text-yellow-400'
                        : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-sm'
                        }`}
                    title={darkMode ? 'Modo claro' : 'Modo oscuro'}
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                <ContributionGraph
                    entries={entries}
                    title={customTitle}
                    darkMode={darkMode}
                />
            </div>
        </main>
    )
}
