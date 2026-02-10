'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Plus, Bell } from 'lucide-react';

const titleMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/create': 'Yangi smeta yaratish',
};

interface NavbarProps {
    onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
    const pathname = usePathname();

    const title =
        titleMap[pathname] ||
        (pathname.startsWith('/edit') ? 'Smetani tahrirlash' : 'Bolajakolim');

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="sidebar-toggle" onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                <h1 className="topbar-title">{title}</h1>
            </div>
            <div className="topbar-right">
                <button className="btn btn-ghost btn-icon-only" style={{ border: 'none' }}>
                    <Bell size={18} />
                </button>
                <Link href="/create" className="btn btn-primary btn-sm">
                    <Plus size={16} />
                    <span className="hide-mobile">Yangi smeta</span>
                </Link>
            </div>
        </header>
    );
}
