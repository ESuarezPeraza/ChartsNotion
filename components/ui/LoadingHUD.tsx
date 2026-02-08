interface LoadingHUDProps {
    message?: string
}

/**
 * Minimalist loading indicator
 */
export default function LoadingHUD({ message }: LoadingHUDProps) {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
                {/* Simple spinner */}
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                {message && (
                    <p className="text-sm text-gray-400 font-medium">
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}
