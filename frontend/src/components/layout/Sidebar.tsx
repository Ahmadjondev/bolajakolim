'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FilePlus,
    LogOut,
    FileSpreadsheet,
    X,
    ChevronLeft,
    Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/create', label: 'Yangi smeta', icon: FilePlus },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const initials = user
        ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
        : '?';

    return (
        <>
            {open && <div className="sidebar-overlay" onClick={onClose} />}
            <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <Link href="/dashboard" className="sidebar-logo">
                        <FileSpreadsheet size={22} />
                        {!collapsed && <span>Bolajakolim</span>}
                    </Link>
                    <button
                        className="sidebar-collapse-btn hide-mobile"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Kengaytirish' : "Yig'ish"}
                    >
                        <ChevronLeft size={16} className={collapsed ? 'rotate-180' : ''} />
                    </button>
                    <button className="sidebar-close-btn show-mobile" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {!collapsed && <div className="sidebar-section-label">Asosiy</div>}

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon size={18} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {!collapsed && (
                    <div style={{ padding: '0 12px', marginBottom: '12px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))',
                            border: '1px solid rgba(99,102,241,0.1)',
                            borderRadius: '10px',
                            padding: '14px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <Sparkles size={14} style={{ color: 'var(--primary-light)' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)' }}>Pro tip</span>
                            </div>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                Excel faylni yuklab olish uchun smetani &quot;Tayyor&quot; holatiga o&apos;tkazing
                            </p>
                        </div>
                    </div>
                )}

                <div className="sidebar-footer">
                    <div className="sidebar-user" title={user?.email}>
                        <div className="sidebar-avatar">{initials}</div>
                        {!collapsed && (
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">
                                    {user?.first_name} {user?.last_name}
                                </span>
                                <span className="sidebar-user-email">{user?.email}</span>
                            </div>
                        )}
                    </div>
                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                        title="Chiqish"
                    >
                        <LogOut size={16} />
                        {!collapsed && <span>Chiqish</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
