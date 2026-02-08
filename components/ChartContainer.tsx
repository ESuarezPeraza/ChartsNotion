interface ChartContainerProps {
    children: React.ReactNode
    title?: string
    className?: string
}

/**
 * Container with neon border effects for charts
 */
export default function ChartContainer({
    children,
    title,
    className = '',
}: ChartContainerProps) {
    return (
        <div
            className={`
        relative p-4
        bg-cyber-card
        border border-neon-cyan/30
        hover:border-neon-cyan/60
        transition-all duration-300
        hud-corners
        ${className}
      `}
        >
            {/* Optional Title */}
            {title && (
                <div className="mb-4 pb-2 border-b border-neon-cyan/20">
                    <h2 className="text-neon-cyan text-sm font-bold uppercase tracking-wider">
                        {title}
                    </h2>
                </div>
            )}

            {/* Chart Content */}
            <div className="relative">
                {children}
            </div>

            {/* Decoration: Corner Glow */}
            <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-neon-cyan/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-neon-magenta/20 to-transparent pointer-events-none" />
        </div>
    )
}
