'use client';

import { useState, useCallback } from 'react';
import AuthGuard from '@/components/layout/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const openSidebar = useCallback(() => setSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    return (
        <AuthGuard>
            <div className="dash-layout">
                <Sidebar open={sidebarOpen} onClose={closeSidebar} />
                <div className="dash-main">
                    <Navbar onMenuClick={openSidebar} />
                    <main className="dash-content">{children}</main>
                </div>
            </div>
        </AuthGuard>
    );
}
