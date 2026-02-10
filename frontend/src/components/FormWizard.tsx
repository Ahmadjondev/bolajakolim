'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Save,
    CheckCircle,
    Loader2,
    FileDown,
    ClipboardList,
    Users,
    Package,
    Layers,
    Receipt,
    ShoppingBag,
    Clock,
    TrendingUp,
    Check,
    AlertCircle,
} from 'lucide-react';
import type { FormData } from '@/types';
import { apiCreateSmeta, apiUpdateSmeta } from '@/lib/api';
import { generateExcel } from '@/utils/excelGenerator';

import ProjectInfoForm from './forms/ProjectInfoForm';
import SalaryForm from './forms/SalaryForm';
import InventoryForm from './forms/InventoryForm';
import RawMaterialsForm from './forms/RawMaterialsForm';
import OtherExpensesForm from './forms/OtherExpensesForm';
import ProductsForm from './forms/ProductsForm';
import DavrXarajatlariForm from './forms/DavrXarajatlariForm';
import SotishRejasiForm from './forms/SotishRejasiForm';

const steps = [
    { label: 'Loyiha', icon: ClipboardList },
    { label: 'Ish haqi', icon: Users },
    { label: 'Inventar', icon: Package },
    { label: 'Xom ashyo', icon: Layers },
    { label: 'Xarajatlar', icon: Receipt },
    { label: 'Mahsulotlar', icon: ShoppingBag },
    { label: 'Davr xar.', icon: Clock },
    { label: 'Sotish', icon: TrendingUp },
];

const defaultFormData: FormData = {
    projectInfo: {
        projectName: '',
        organizationName: '',
        projectDescription: '',
        projectDurationYears: 2,
    },
    salary: { managementStaff: [], productionStaff: [] },
    inventory: [],
    rawMaterials: [],
    otherExpenses: { managementExpenses: [], productionExpenses: [] },
    products: [],
    davrXarajatlari: { expenses: [] },
    sotishRejasi: { years: [] },
};

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Convert frontend FormData to the API payload format matching the backend serializer.
 */
function toApiPayload(data: FormData, st: 'draft' | 'completed') {
    return {
        project_name: data.projectInfo.projectName,
        organization_name: data.projectInfo.organizationName,
        project_description: data.projectInfo.projectDescription,
        project_duration_years: data.projectInfo.projectDurationYears,
        status: st,
        salary: {
            management_staff: data.salary.managementStaff.map((e) => ({
                position: e.position,
                count: e.count,
                monthly_salary: e.monthlySalary,
                duration_months: e.durationMonths,
                financing_source: e.financingSource,
            })),
            production_staff: data.salary.productionStaff.map((e) => ({
                position: e.position,
                count: e.count,
                monthly_salary: e.monthlySalary,
                duration_months: e.durationMonths,
                financing_source: e.financingSource,
            })),
        },
        inventory: data.inventory.map((i) => ({
            name: i.name,
            description: i.description,
            link: i.link,
            unit: i.unit,
            quantity: i.quantity,
            price: i.price,
            financing_source: i.financingSource,
        })),
        raw_materials: data.rawMaterials.map((i) => ({
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
            price: i.price,
            financing_source: i.financingSource,
        })),
        other_expenses: {
            management_expenses: data.otherExpenses.managementExpenses.map((e) => ({
                name: e.name,
                unit: e.unit,
                quantity: e.quantity,
                price: e.price,
                financing_source: e.financingSource,
            })),
            production_expenses: data.otherExpenses.productionExpenses.map((e) => ({
                name: e.name,
                unit: e.unit,
                quantity: e.quantity,
                price: e.price,
                financing_source: e.financingSource,
            })),
        },
        products: data.products.map((p) => ({
            name: p.name,
            quantity: p.quantity,
        })),
        davr_xarajatlari: data.davrXarajatlari.expenses.map((e) => ({
            name: e.name,
            amount: e.amount,
        })),
        sotish_rejasi: data.sotishRejasi.years.map((y) => ({
            year: y.year,
            products: y.products.map((p) => ({
                name: p.name,
                unit: p.unit,
                quantity: p.quantity,
                price: p.price,
            })),
        })),
    };
}

/**
 * Convert the backend API response to frontend FormData format.
 */
export function fromApiResponse(res: any): FormData {
    const salary = res.salary || {};
    const otherExpenses = res.other_expenses || {};

    return {
        projectInfo: {
            projectName: res.project_name || '',
            organizationName: res.organization_name || '',
            projectDescription: res.project_description || '',
            projectDurationYears: res.project_duration_years || 2,
        },
        salary: {
            managementStaff: (salary.management_staff || []).map((e: any) => ({
                id: String(e.id ?? crypto.randomUUID()),
                position: e.position,
                count: e.count,
                monthlySalary: Number(e.monthly_salary),
                durationMonths: e.duration_months,
                financingSource: e.financing_source,
            })),
            productionStaff: (salary.production_staff || []).map((e: any) => ({
                id: String(e.id ?? crypto.randomUUID()),
                position: e.position,
                count: e.count,
                monthlySalary: Number(e.monthly_salary),
                durationMonths: e.duration_months,
                financingSource: e.financing_source,
            })),
        },
        inventory: (res.inventory || []).map((i: any) => ({
            id: String(i.id ?? crypto.randomUUID()),
            name: i.name,
            description: i.description || '',
            link: i.link || '',
            unit: i.unit,
            quantity: i.quantity,
            price: Number(i.price),
            financingSource: i.financing_source,
        })),
        rawMaterials: (res.raw_materials || []).map((i: any) => ({
            id: String(i.id ?? crypto.randomUUID()),
            name: i.name,
            unit: i.unit,
            quantity: i.quantity,
            price: Number(i.price),
            financingSource: i.financing_source,
        })),
        otherExpenses: {
            managementExpenses: (otherExpenses.management_expenses || []).map((e: any) => ({
                id: String(e.id ?? crypto.randomUUID()),
                name: e.name,
                unit: e.unit,
                quantity: e.quantity,
                price: Number(e.price),
                financingSource: e.financing_source,
            })),
            productionExpenses: (otherExpenses.production_expenses || []).map((e: any) => ({
                id: String(e.id ?? crypto.randomUUID()),
                name: e.name,
                unit: e.unit,
                quantity: e.quantity,
                price: Number(e.price),
                financingSource: e.financing_source,
            })),
        },
        products: (res.products || []).map((p: any) => ({
            id: String(p.id ?? crypto.randomUUID()),
            name: p.name,
            quantity: p.quantity,
        })),
        davrXarajatlari: {
            expenses: (res.davr_xarajatlari || []).map((e: any) => ({
                id: String(e.id ?? crypto.randomUUID()),
                name: e.name,
                amount: Number(e.amount),
            })),
        },
        sotishRejasi: {
            years: (res.sotish_rejasi || []).map((y: any) => ({
                year: y.year,
                products: (y.products || []).map((p: any) => ({
                    id: String(p.id ?? crypto.randomUUID()),
                    name: p.name,
                    unit: p.unit,
                    quantity: p.quantity,
                    price: Number(p.price),
                })),
            })),
        },
    };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface FormWizardProps {
    initialData?: FormData;
    smetaId?: number;
}

export default function FormWizard({ initialData, smetaId: initialSmetaId }: FormWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<FormData>(initialData || defaultFormData);
    const [smetaId, setSmetaId] = useState<number | null>(initialSmetaId ?? null);
    const [saving, setSaving] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear save status indicator after 3s
    useEffect(() => {
        if (saveStatus === 'saved' || saveStatus === 'error') {
            const t = setTimeout(() => setSaveStatus('idle'), 3000);
            return () => clearTimeout(t);
        }
    }, [saveStatus]);

    const updateField = useCallback(
        <K extends keyof FormData>(key: K, value: FormData[K]) => {
            setData((prev) => ({ ...prev, [key]: value }));
        },
        [],
    );

    /**
     * Core save function. Creates new smeta if no smetaId, otherwise updates.
     * Returns the saved smeta ID.
     */
    const doSave = useCallback(async (formData: FormData, status: 'draft' | 'completed', currentSmetaId: number | null): Promise<number | null> => {
        // Don't save if project name is empty
        if (!formData.projectInfo.projectName.trim()) return currentSmetaId;

        const payload = toApiPayload(formData, status);

        if (currentSmetaId) {
            await apiUpdateSmeta(currentSmetaId, payload);
            return currentSmetaId;
        } else {
            const result = await apiCreateSmeta(payload);
            return result.id;
        }
    }, []);

    /**
     * Auto-save as draft. Called on step navigation.
     */
    const autoSave = useCallback(async (formData: FormData, currentSmetaId: number | null) => {
        if (!formData.projectInfo.projectName.trim()) return currentSmetaId;

        setSaveStatus('saving');
        try {
            const newId = await doSave(formData, 'draft', currentSmetaId);
            if (newId && !currentSmetaId) {
                setSmetaId(newId);
                window.history.replaceState(null, '', `/edit/${newId}`);
            }
            setSaveStatus('saved');
            return newId;
        } catch {
            setSaveStatus('error');
            return currentSmetaId;
        }
    }, [doSave]);

    /**
     * Debounced auto-save — triggers 2s after last data change.
     */
    const scheduleAutoSave = useCallback((formData: FormData, currentSmetaId: number | null) => {
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(() => {
            autoSave(formData, currentSmetaId);
        }, 2000);
    }, [autoSave]);

    // Auto-save when data changes (debounced)
    useEffect(() => {
        scheduleAutoSave(data, smetaId);
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, [data, smetaId, scheduleAutoSave]);

    /**
     * Navigate to a step with auto-save.
     */
    const goToStep = useCallback(async (nextStep: number) => {
        // Cancel pending debounced save
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        // Save immediately before navigating
        await autoSave(data, smetaId);
        setStep(nextStep);
    }, [data, smetaId, autoSave]);

    /**
     * Manual save as draft.
     */
    const saveDraft = async () => {
        setSaving(true);
        try {
            const newId = await doSave(data, 'draft', smetaId);
            if (newId && !smetaId) {
                setSmetaId(newId);
                window.history.replaceState(null, '', `/edit/${newId}`);
            }
            setSaveStatus('saved');
        } catch {
            alert("Saqlashda xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    /**
     * Complete and finalize the smeta.
     */
    const complete = async () => {
        if (!data.projectInfo.projectName.trim()) {
            alert("Loyiha nomini kiriting");
            setStep(0);
            return;
        }
        setCompleting(true);
        try {
            await doSave(data, 'completed', smetaId);
            router.push('/dashboard');
        } catch {
            alert("Saqlashda xatolik yuz berdi");
        } finally {
            setCompleting(false);
        }
    };

    const renderForm = () => {
        switch (step) {
            case 0:
                return (
                    <ProjectInfoForm
                        data={data.projectInfo}
                        onChange={(v) => updateField('projectInfo', v)}
                    />
                );
            case 1:
                return (
                    <SalaryForm
                        data={data.salary}
                        onChange={(v) => updateField('salary', v)}
                    />
                );
            case 2:
                return (
                    <InventoryForm
                        data={data.inventory}
                        onChange={(v) => updateField('inventory', v)}
                    />
                );
            case 3:
                return (
                    <RawMaterialsForm
                        data={data.rawMaterials}
                        onChange={(v) => updateField('rawMaterials', v)}
                    />
                );
            case 4:
                return (
                    <OtherExpensesForm
                        data={data.otherExpenses}
                        onChange={(v) => updateField('otherExpenses', v)}
                    />
                );
            case 5:
                return (
                    <ProductsForm
                        data={data.products}
                        onChange={(v) => updateField('products', v)}
                    />
                );
            case 6:
                return (
                    <DavrXarajatlariForm
                        data={data.davrXarajatlari}
                        onChange={(v) => updateField('davrXarajatlari', v)}
                    />
                );
            case 7:
                return (
                    <SotishRejasiForm
                        data={data.sotishRejasi}
                        onChange={(v) => updateField('sotishRejasi', v)}
                        projectDurationYears={data.projectInfo.projectDurationYears}
                    />
                );
            default:
                return null;
        }
    };

    const isLast = step === steps.length - 1;

    return (
        <div className="wizard">
            {/* Progress Steps */}
            <div className="progress-steps">
                {steps.map((s, i) => (
                    <button
                        key={i}
                        className={`progress-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                        onClick={() => goToStep(i)}
                    >
                        <span className="progress-step-icon">
                            {i < step ? <CheckCircle size={18} /> : <s.icon size={18} />}
                        </span>
                        <span className="progress-step-label">{s.label}</span>
                    </button>
                ))}
            </div>

            {/* Save Status Indicator */}
            {saveStatus !== 'idle' && (
                <div className={`save-indicator ${saveStatus}`}>
                    {saveStatus === 'saving' && <><Loader2 size={14} className="spin" /> Saqlanmoqda...</>}
                    {saveStatus === 'saved' && <><Check size={14} /> Saqlandi</>}
                    {saveStatus === 'error' && <><AlertCircle size={14} /> Xatolik</>}
                </div>
            )}

            {/* Form Content */}
            <div className="wizard-content">{renderForm()}</div>

            {/* Footer Actions */}
            <div className="wizard-footer">
                <button
                    className="btn btn-ghost"
                    onClick={() => goToStep(Math.max(0, step - 1))}
                    disabled={step === 0}
                >
                    <ChevronLeft size={18} />
                    Orqaga
                </button>

                <div className="wizard-footer-right">
                    <button
                        className="btn btn-ghost"
                        onClick={saveDraft}
                        disabled={saving || completing}
                    >
                        {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                        Saqlash
                    </button>

                    {isLast ? (
                        <>
                            <button
                                className="btn btn-ghost"
                                onClick={async () => {
                                    try {
                                        await generateExcel(data);
                                    } catch {
                                        alert('Excel yaratishda xatolik');
                                    }
                                }}
                            >
                                <FileDown size={18} />
                                Excel yuklab olish
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={complete}
                                disabled={saving || completing}
                            >
                                {completing ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
                                Yakunlash
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={() => goToStep(Math.min(steps.length - 1, step + 1))}
                        >
                            Keyingi
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
