/** @type {import('next').NextConfig} */
const nextConfig = {
    // Permitir embed en iframes (para Notion)
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: 'frame-ancestors *',
                    },
                ],
            },
        ]
    },
    // Optimizaciones para Vercel Hobby
    experimental: {
        optimizePackageImports: ['lucide-react', 'echarts'],
    },
}

module.exports = nextConfig
