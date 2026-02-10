import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    title: 'Bolajakolim — Xarajatlar Smetasi',
    description:
        'Loyihangiz uchun professional xarajatlar smetasini yarating, avtomatik hisoblang va Excel formatida yuklab oling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="uz">
            <body className={inter.className}>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
