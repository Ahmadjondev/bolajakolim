'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    Download,
    FileSpreadsheet,
    Calendar,
    Building2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Clock,
    CheckCircle2,
} from 'lucide-react';
import {
    apiListSmetalar,
    apiDeleteSmeta,
    apiGetSmeta,
    type SmetaListItem,
} from '@/lib/api';
import { fromApiResponse } from '@/components/FormWizard';
import { generateExcel } from '@/utils/excelGenerator';

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatMoney(n: number) {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + ' mlrd';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' mln';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + ' ming';
    return n.toLocaleString('uz-UZ');
}

const PAGE_SIZE = 12;

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [items, setItems] = useState<SmetaListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [downloading, setDownloading] = useState<number | null>(null);

    const page = Number(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const [searchInput, setSearchInput] = useState(search);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiListSmetalar({
                page,
                search: search || undefined,
                status: status || undefined,
            });
            setItems(res.results);
            setTotalCount(res.count);
        } catch {
            /* empty */
        } finally {
            setLoading(false);
        }
    }, [page, search, status]);

    useEffect(() => {
        load();
    }, [load]);

    const pushParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([k, v]) => {
            if (v) params.set(k, v);
            else params.delete(k);
        });
        params.delete('page');
        router.push(`/dashboard?${params.toString()}`);
    };

    const handleSearch = () => pushParams({ search: searchInput });

    const handleDelete = async (id: number) => {
        if (!confirm("Bu smetani o'chirmoqchimisiz?")) return;
        setDeleting(id);
        try {
            await apiDeleteSmeta(id);
            load();
        } catch {
            /* empty */
        } finally {
            setDeleting(null);
        }
    };

    /**
     * Download Excel client-side: fetch full smeta data, convert, generate.
     */
    const handleDownload = async (id: number) => {
        setDownloading(id);
        try {
            const res = await apiGetSmeta(id);
            const formData = fromApiResponse(res);
            await generateExcel(formData);
        } catch {
            alert('Excel yaratishda xatolik');
        } finally {
            setDownloading(null);
        }
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const draftCount = items.filter((i) => i.status === 'draft').length;
    const completedCount = items.filter((i) => i.status === 'completed').length;

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h2>Smetalar</h2>
                    <p className="dashboard-subtitle">
                        {totalCount} ta smeta topildi
                    </p>
                </div>
                <Link href="/create" className="btn btn-primary">
                    <Plus size={18} />
                    Yangi smeta
                </Link>
            </div>

            {/* Quick Stats */}
            {!loading && totalCount > 0 && (
                <div className="summary-grid" style={{ marginBottom: '24px' }}>
                    <div className="summary-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                            <span className="summary-label" style={{ marginBottom: 0 }}>Jami smetalar</span>
                        </div>
                        <div className="summary-value" style={{ fontSize: '1.5rem' }}>
                            {totalCount}
                        </div>
                    </div>
                    <div className="summary-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Clock size={16} style={{ color: 'var(--warning)' }} />
                            <span className="summary-label" style={{ marginBottom: 0 }}>Qoralamalar</span>
                        </div>
                        <div className="summary-value" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>
                            {draftCount}
                        </div>
                    </div>
                    <div className="summary-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                            <span className="summary-label" style={{ marginBottom: 0 }}>Tayyor</span>
                        </div>
                        <div className="summary-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
                            {completedCount}
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="dashboard-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Loyiha nomi bo'yicha qidirish..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <div className="status-tabs">
                    {[
                        { value: '', label: 'Barchasi' },
                        { value: 'draft', label: 'Qoralama' },
                        { value: 'completed', label: 'Tayyor' },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            className={`status-tab ${status === tab.value ? 'active' : ''}`}
                            onClick={() => pushParams({ status: tab.value })}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="loading-page">
                    <span className="loading-spinner" />
                    <p>Yuklanmoqda...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <FileSpreadsheet size={48} />
                    <h3>Smeta topilmadi</h3>
                    <p>Hali hech qanday smeta yaratilmagan yoki qidiruv natijasi bo&apos;sh.</p>
                    <Link href="/create" className="btn btn-primary">
                        <Plus size={18} />
                        Birinchi smetangizni yarating
                    </Link>
                </div>
            ) : (
                <>
                    <div className="smeta-grid">
                        {items.map((item) => (
                            <div key={item.id} className="smeta-card">
                                <div className="smeta-card-header">
                                    <h3>{item.project_name}</h3>
                                    <span className={`status-badge ${item.status}`}>
                                        {item.status === 'draft' ? 'Qoralama' : 'Tayyor'}
                                    </span>
                                </div>

                                <div className="smeta-card-meta">
                                    <span>
                                        <Building2 size={14} />
                                        {item.organization_name || '\u2014'}
                                    </span>
                                    <span>
                                        <Calendar size={14} />
                                        {formatDate(item.updated_at)}
                                    </span>
                                </div>

                                {item.grand_total > 0 && (
                                    <div className="smeta-card-total">
                                        {formatMoney(item.grand_total)} so&apos;m
                                    </div>
                                )}

                                <div className="smeta-card-actions">
                                    <Link href={`/edit/${item.id}`} className="btn btn-ghost btn-sm">
                                        <Pencil size={14} />
                                        Tahrirlash
                                    </Link>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleDownload(item.id)}
                                        disabled={downloading === item.id}
                                    >
                                        {downloading === item.id ? (
                                            <Loader2 size={14} className="spin" />
                                        ) : (
                                            <Download size={14} />
                                        )}
                                        Excel
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm btn-danger"
                                        onClick={() => handleDelete(item.id)}
                                        disabled={deleting === item.id}
                                    >
                                        {deleting === item.id ? (
                                            <Loader2 size={14} className="spin" />
                                        ) : (
                                            <Trash2 size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                disabled={page <= 1}
                                onClick={() =>
                                    router.push(
                                        `/dashboard?page=${page - 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`
                                    )
                                }
                            >
                                <ChevronLeft size={16} />
                                Oldingi
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/dashboard?page=${p}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}
                                    className={`pagination-btn ${p === page ? 'active' : ''}`}
                                >
                                    {p}
                                </Link>
                            ))}
                            <button
                                disabled={page >= totalPages}
                                onClick={() =>
                                    router.push(
                                        `/dashboard?page=${page + 1}${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`
                                    )
                                }
                            >
                                Keyingi
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
