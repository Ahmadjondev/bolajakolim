'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiGetSmeta } from '@/lib/api';
import FormWizard, { fromApiResponse } from '@/components/FormWizard';
import type { FormData } from '@/types';

export default function EditSmetaPage() {
    const params = useParams<{ id: string }>();
    const [data, setData] = useState<FormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const id = Number(params.id);
        if (!id) {
            setError('Noto\'g\'ri smeta ID');
            setLoading(false);
            return;
        }
        apiGetSmeta(id)
            .then((res) => setData(fromApiResponse(res)))
            .catch(() => setError('Smetani yuklashda xatolik'))
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) {
        return (
            <div className="loading-page">
                <span className="loading-spinner" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="empty-state">
                <h3>{error || 'Smeta topilmadi'}</h3>
            </div>
        );
    }

    return <FormWizard initialData={data} smetaId={Number(params.id)} />;
}
