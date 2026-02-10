import { useState } from 'react';
import { Plus, Pencil, Trash2, Receipt, Briefcase, X } from 'lucide-react';
import type { OtherExpense, OtherExpensesData } from '../../types';
import { formatNumber, calculateOtherExpensesTotals } from '../../utils/calculations';

interface OtherExpensesFormProps {
    data: OtherExpensesData;
    onChange: (data: OtherExpensesData) => void;
}

type ExpenseType = 'management' | 'production';

interface ModalState {
    isOpen: boolean;
    type: ExpenseType;
    editIndex: number | null;
}

const initialExpense: Omit<OtherExpense, 'id'> = {
    name: '',
    unit: 'oy',
    quantity: 10,
    price: 0,
    financingSource: 'vazirlik',
};

export default function OtherExpensesForm({ data, onChange }: OtherExpensesFormProps) {
    const [modal, setModal] = useState<ModalState>({ isOpen: false, type: 'management', editIndex: null });
    const [formExpense, setFormExpense] = useState<Omit<OtherExpense, 'id'>>(initialExpense);

    const totals = calculateOtherExpensesTotals(data);

    const openModal = (type: ExpenseType, editIndex: number | null = null) => {
        if (editIndex !== null) {
            const list = type === 'management' ? data.managementExpenses : data.productionExpenses;
            const exp = list[editIndex];
            setFormExpense({
                name: exp.name,
                unit: exp.unit,
                quantity: exp.quantity,
                price: exp.price,
                financingSource: exp.financingSource,
            });
        } else {
            setFormExpense(initialExpense);
        }
        setModal({ isOpen: true, type, editIndex });
    };

    const closeModal = () => {
        setModal({ isOpen: false, type: 'management', editIndex: null });
        setFormExpense(initialExpense);
    };

    const handleSave = () => {
        const newExpense: OtherExpense = {
            id: modal.editIndex !== null
                ? (modal.type === 'management' ? data.managementExpenses[modal.editIndex].id : data.productionExpenses[modal.editIndex].id)
                : Date.now().toString(),
            ...formExpense,
        };

        if (modal.type === 'management') {
            if (modal.editIndex !== null) {
                const updated = [...data.managementExpenses];
                updated[modal.editIndex] = newExpense;
                onChange({ ...data, managementExpenses: updated });
            } else {
                onChange({ ...data, managementExpenses: [...data.managementExpenses, newExpense] });
            }
        } else {
            if (modal.editIndex !== null) {
                const updated = [...data.productionExpenses];
                updated[modal.editIndex] = newExpense;
                onChange({ ...data, productionExpenses: updated });
            } else {
                onChange({ ...data, productionExpenses: [...data.productionExpenses, newExpense] });
            }
        }
        closeModal();
    };

    const handleDelete = (type: ExpenseType, index: number) => {
        if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
            if (type === 'management') {
                onChange({ ...data, managementExpenses: data.managementExpenses.filter((_, i) => i !== index) });
            } else {
                onChange({ ...data, productionExpenses: data.productionExpenses.filter((_, i) => i !== index) });
            }
        }
    };

    const renderExpenseCard = (exp: OtherExpense, index: number, type: ExpenseType) => {
        const total = exp.price * exp.quantity;
        return (
            <div key={exp.id} className="item-card">
                <div className="item-card-header">
                    <span className="item-card-title">{exp.name}</span>
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
                        <span className="item-stat-label">Birlik</span>
                        <span className="item-stat-value">{exp.unit}</span>
                    </div>
                    <div className="item-stat">
                        <span className="item-stat-label">Miqdori</span>
                        <span className="item-stat-value">{exp.quantity}</span>
                    </div>
                    <div className="item-stat">
                        <span className="item-stat-label">Narxi</span>
                        <span className="item-stat-value">{formatNumber(exp.price)}</span>
                    </div>
                    <div className="item-stat">
                        <span className="item-stat-label">Jami</span>
                        <span className="item-stat-value" style={{ color: 'var(--primary-light)' }}>{formatNumber(total)}</span>
                    </div>
                    <div className="item-stat">
                        <span className="item-stat-label">Manba</span>
                        <span className="item-stat-value" style={{ color: exp.financingSource === 'vazirlik' ? 'var(--primary)' : 'var(--success)' }}>
                            {exp.financingSource === 'vazirlik' ? 'Vazirlik' : 'Tashkilot'}
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
                    <Receipt size={18} />
                    Boshqa xarajatlar xulosasi
                </h3>
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-label">Jami xarajatlar</div>
                        <div className="summary-value">
                            {formatNumber(totals.total / 1000)}
                            <span className="summary-unit"> ming so&apos;m</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Vazirlik hisobidan</div>
                        <div className="summary-value">
                            {formatNumber(totals.vazirlik / 1000)}
                            <span className="summary-unit"> ming so&apos;m</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Tashkilot hisobidan</div>
                        <div className="summary-value">
                            {formatNumber(totals.tashkilot / 1000)}
                            <span className="summary-unit"> ming so&apos;m</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Boshqa ma'muriy xarajatlar */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">
                        <Briefcase size={18} />
                        Boshqa ma&apos;muriy xarajatlar
                    </h2>
                    <p className="card-subtitle">Ofis ijarasi, sotish, marketing va boshqa xarajatlar</p>
                </div>

                <div className="item-list">
                    {data.managementExpenses.map((exp, idx) => renderExpenseCard(exp, idx, 'management'))}
                </div>

                <button className="add-button" onClick={() => openModal('management')}>
                    <Plus size={18} />
                    Xarajat qo&apos;shish
                </button>
            </div>

            {/* Ishlab chiqarish bilan bog'liq boshqa xarajatlar */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <Receipt size={18} />
                        Ishlab chiqarish xarajatlari
                    </h2>
                    <p className="card-subtitle">Server, elektr energiya, internet va boshqa xarajatlar</p>
                </div>

                <div className="item-list">
                    {data.productionExpenses.map((exp, idx) => renderExpenseCard(exp, idx, 'production'))}
                </div>

                <button className="add-button" onClick={() => openModal('production')}>
                    <Plus size={18} />
                    Xarajat qo&apos;shish
                </button>
            </div>

            {/* Modal */}
            {modal.isOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modal.editIndex !== null ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Xarajat nomi *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Masalan: Ofis ijarasi (100 m2)"
                                    value={formExpense.name}
                                    onChange={(e) => setFormExpense({ ...formExpense, name: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">O&apos;lchov birligi</label>
                                    <select
                                        className="form-input form-select"
                                        value={formExpense.unit}
                                        onChange={(e) => setFormExpense({ ...formExpense, unit: e.target.value })}
                                    >
                                        <option value="oy">oy</option>
                                        <option value="dona">dona</option>
                                        <option value="kVt">kVt</option>
                                        <option value="soat">soat</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Miqdori</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="1"
                                        value={formExpense.quantity}
                                        onChange={(e) => setFormExpense({ ...formExpense, quantity: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Birlik narxi (so&apos;m)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="0"
                                    step="100000"
                                    value={formExpense.price}
                                    onChange={(e) => setFormExpense({ ...formExpense, price: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Moliyalashtirish manbasi</label>
                                <div className="radio-group">
                                    <div className="radio-option">
                                        <input type="radio" id="exp-vazirlik" name="exp-source" checked={formExpense.financingSource === 'vazirlik'} onChange={() => setFormExpense({ ...formExpense, financingSource: 'vazirlik' })} />
                                        <label htmlFor="exp-vazirlik">Vazirlik</label>
                                    </div>
                                    <div className="radio-option">
                                        <input type="radio" id="exp-tashkilot" name="exp-source" checked={formExpense.financingSource === 'tashkilot'} onChange={() => setFormExpense({ ...formExpense, financingSource: 'tashkilot' })} />
                                        <label htmlFor="exp-tashkilot">Tashkilot</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeModal}>Bekor qilish</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!formExpense.name || formExpense.price <= 0}>Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
