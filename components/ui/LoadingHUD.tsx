import { Loader2 } from 'lucide-react'

interface LoadingHUDProps {
    message?: string
}

/**
 * Sci-Fi HUD style loading indicator
 */
export default function LoadingHUD({ message = 'LOADING DATA...' }: LoadingHUDProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            {/* Spinning loader with neon glow */}
            <div className="relative">
                <Loader2
                    className="w-12 h-12 text-neon-cyan animate-spin"
                    style={{
                        filter: 'drop-shadow(0 0 10px #00f3ff)',
                    }}
                />
                {/* Outer ring */}
                <div
                    className="absolute inset-0 w-12 h-12 border-2 border-neon-cyan/30 rounded-full animate-ping"
                    style={{
                        animationDuration: '1.5s',
                    }}
                />
            </div>

            {/* Loading text */}
            <div className="text-center">
                <p className="text-neon-cyan text-sm font-mono animate-pulse">
                    {message}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    )
}
