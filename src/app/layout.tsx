
import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
    title: 'Portal Feitosa Soluções',
    description: 'Atendimento, Chamados, Inventário e Serviços',
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
