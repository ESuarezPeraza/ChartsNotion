import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorDisplayProps {
    message: string
    onRetry?: () => void
}

/**
 * Cyberpunk styled error display
 */
export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-6">
            {/* Error Icon */}
            <div className="relative">
                <AlertTriangle
                    className="w-16 h-16 text-neon-magenta"
                    style={{
                        filter: 'drop-shadow(0 0 15px #ff00ff)',
                    }}
                />
            </div>

            {/* Error Message */}
            <div className="text-center max-w-md">
                <h3 className="text-neon-magenta text-lg font-bold mb-2">
          // ERROR
                </h3>
                <p className="text-gray-400 text-sm font-mono">
                    {message}
                </p>
            </div>

            {/* Retry Button */}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="
            mt-4 px-6 py-2
            flex items-center gap-2
            bg-transparent
            border border-neon-cyan/50
            text-neon-cyan text-sm
            hover:border-neon-cyan
            hover:shadow-neon-cyan
            transition-all duration-300
            font-mono
          "
                >
                    <RefreshCw className="w-4 h-4" />
                    RETRY
                </button>
            )}

            {/* Decorative glitch lines */}
            <div className="absolute left-0 right-0 h-px bg-neon-magenta/30 animate-pulse" style={{ top: '30%' }} />
            <div className="absolute left-0 right-0 h-px bg-neon-magenta/20 animate-pulse" style={{ top: '70%', animationDelay: '0.5s' }} />
        </div>
    )
}
