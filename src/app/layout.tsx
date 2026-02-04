
import type { Metadata } from 'next'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
    title: 'Feitosa Solucoes',
    description: 'Sistema de Emissão de Nota Fiscal de Serviço Eletrônica',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
