import { useState } from 'react';
import { Plus, Pencil, Trash2, Users, Briefcase, X } from 'lucide-react';
import type { Employee, SalaryData } from '../../types';
import { formatNumber, calculateSalaryTotals } from '../../utils/calculations';

interface SalaryFormProps {
    data: SalaryData;
    onChange: (data: SalaryData) => void;
}

type StaffType = 'management' | 'production';

interface ModalState {
    isOpen: boolean;
    type: StaffType;
    editIndex: number | null;
}

const initialEmployee: Omit<Employee, 'id'> = {
    position: '',
    count: 1,
    monthlySalary: 0,
    durationMonths: 10,
    financingSource: 'vazirlik',
};

export default function SalaryForm({ data, onChange }: SalaryFormProps) {
    const [modal, setModal] = useState<ModalState>({ isOpen: false, type: 'management', editIndex: null });
    const [formEmployee, setFormEmployee] = useState<Omit<Employee, 'id'>>(initialEmployee);

    const totals = calculateSalaryTotals(data);

    const openModal = (type: StaffType, editIndex: number | null = null) => {
        if (editIndex !== null) {
            const list = type === 'management' ? data.managementStaff : data.productionStaff;
            const emp = list[editIndex];
            setFormEmployee({
                position: emp.position,
                count: emp.count,
                monthlySalary: emp.monthlySalary,
                durationMonths: emp.durationMonths,
                financingSource: emp.financingSource,
            });
        } else {
            setFormEmployee(initialEmployee);
        }
        setModal({ isOpen: true, type, editIndex });
    };

    const closeModal = () => {
        setModal({ isOpen: false, type: 'management', editIndex: null });
        setFormEmployee(initialEmployee);
    };

    const handleSave = () => {
        const newEmployee: Employee = {
            id: modal.editIndex !== null
                ? (modal.type === 'management' ? data.managementStaff[modal.editIndex].id : data.productionStaff[modal.editIndex].id)
                : Date.now().toString(),
            ...formEmployee,
        };

        if (modal.type === 'management') {
            if (modal.editIndex !== null) {
                const updated = [...data.managementStaff];
                updated[modal.editIndex] = newEmployee;
                onChange({ ...data, managementStaff: updated });
            } else {
                onChange({ ...data, managementStaff: [...data.managementStaff, newEmployee] });
            }
        } else {
            if (modal.editIndex !== null) {
                const updated = [...data.productionStaff];
                updated[modal.editIndex] = newEmployee;
                onChange({ ...data, productionStaff: updated });
            } else {
                onChange({ ...data, productionStaff: [...data.productionStaff, newEmployee] });
            }
        }
        closeModal();
    };

    const handleDelete = (type: StaffType, index: number) => {
        if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
            if (type === 'management') {
                onChange({ ...data, managementStaff: data.managementStaff.filter((_, i) => i !== index) });
            } else {
                onChange({ ...data, productionStaff: data.productionStaff.filter((_, i) => i !== index) });
            }
        }
    };

    const renderEmployeeCard = (emp: Employee, index: number, type: StaffType) => {
        const total = emp.monthlySalary * emp.count * emp.durationMonths;
        return (
            <div key={emp.id} className="item-card">
                <div className="item-card-header">
                    <span className="item-card-title">{emp.position}</span>
                    <div className="item-card-actions">
                        <button className="btn-icon btn-edit" onClick={() => openModal(type, index)}>
                            <Pencil size={14} />
                        </button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(type, index)}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <div className="item-card-content">
                    <div className="item-stat">
                        <span className="item-stat-label">Soni</span>
                        <span className="item-stat-value">{emp.count} kishi</span>
                    </div>
                    <div className="item-stat">
                        <span className="item-stat-label">Oylik</span>
                        <span className="item-stat-value">{formatNumber(emp.monthlySalary)}</span>
                    </div>
                    <div className="item-stat">
                        <span className="item-stat-label">Muddat</span>
                        <span className="item-stat-value">{emp.durationMonths} oy</span>
                    </div>
                    <div className="item-stat">
                        <span className="item-stat-label">Jami</span>
                        <span className="item-stat-value" style={{ color: 'var(--primary-light)' }}>{formatNumber(total)}</span>
                    </div>
                    <div className="item-stat">
                        <span className="item-stat-label">Manba</span>
                        <span className="item-stat-value" style={{ color: emp.financingSource === 'vazirlik' ? 'var(--primary)' : 'var(--success)' }}>
                            {emp.financingSource === 'vazirlik' ? 'Vazirlik' : 'Tashkilot'}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Summary */}
            <div className="summary-section">
                <h3 className="summary-title">
                    <Users size={18} />
                    Ish haqi fondi xulosasi
                </h3>
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-label">Jami ish haqi</div>
                        <div className="summary-value">
                            {formatNumber(totals.totalSalary / 1000)}
                            <span className="summary-unit"> ming so&apos;m</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Ijtimoiy soliq (12%)</div>
                        <div className="summary-value">
                            {formatNumber(totals.totalSocialTax / 1000)}
                            <span className="summary-unit"> ming so&apos;m</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Umumiy</div>
                        <div className="summary-value">
                            {formatNumber(totals.grandTotal / 1000)}
                            <span className="summary-unit"> ming so&apos;m</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ma'muriy-boshqaruv xodimlari */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">
                        <Briefcase size={18} />
                        Ma&apos;muriy-boshqaruv xodimlari
                    </h2>
                    <p className="card-subtitle">Loyiha rahbari, xisobchi, menejeri va boshqalar</p>
                </div>

                <div className="item-list">
                    {data.managementStaff.map((emp, idx) => renderEmployeeCard(emp, idx, 'management'))}
                </div>

                <button className="add-button" onClick={() => openModal('management')}>
                    <Plus size={18} />
                    Xodim qo&apos;shish
                </button>
            </div>

            {/* Ishlab chiqarish xodimlari */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <Users size={18} />
                        Ishlab chiqarish xodimlari
                    </h2>
                    <p className="card-subtitle">Dasturchilar, dizaynerlar va boshqa mutaxassislar</p>
                </div>

                <div className="item-list">
                    {data.productionStaff.map((emp, idx) => renderEmployeeCard(emp, idx, 'production'))}
                </div>

                <button className="add-button" onClick={() => openModal('production')}>
                    <Plus size={18} />
                    Xodim qo&apos;shish
                </button>
            </div>

            {/* Modal */}
            {modal.isOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modal.editIndex !== null ? 'Xodimni tahrirlash' : 'Yangi xodim'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Lavozimi *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Masalan: Flutter dasturchi"
                                    value={formEmployee.position}
                                    onChange={(e) => setFormEmployee({ ...formEmployee, position: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Ishchilar soni</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="1"
                                        value={formEmployee.count}
                                        onChange={(e) => setFormEmployee({ ...formEmployee, count: parseInt(e.target.value) || 1 })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Bir oylik ish haqi (so&apos;m)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        step="100000"
                                        value={formEmployee.monthlySalary}
                                        onChange={(e) => setFormEmployee({ ...formEmployee, monthlySalary: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Ish davomiyligi (oyda)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    max="12"
                                    value={formEmployee.durationMonths}
                                    onChange={(e) => setFormEmployee({ ...formEmployee, durationMonths: parseInt(e.target.value) || 1 })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Moliyalashtirish manbasi</label>
                                <div className="radio-group">
                                    <div className="radio-option">
                                        <input
                                            type="radio"
                                            id="vazirlik"
                                            name="source"
                                            checked={formEmployee.financingSource === 'vazirlik'}
                                            onChange={() => setFormEmployee({ ...formEmployee, financingSource: 'vazirlik' })}
                                        />
                                        <label htmlFor="vazirlik">Vazirlik</label>
                                    </div>
                                    <div className="radio-option">
                                        <input
                                            type="radio"
                                            id="tashkilot"
                                            name="source"
                                            checked={formEmployee.financingSource === 'tashkilot'}
                                            onChange={() => setFormEmployee({ ...formEmployee, financingSource: 'tashkilot' })}
                                        />
                                        <label htmlFor="tashkilot">Tashkilot</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeModal}>
                                Bekor qilish
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={!formEmployee.position || formEmployee.monthlySalary <= 0}
                            >
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
