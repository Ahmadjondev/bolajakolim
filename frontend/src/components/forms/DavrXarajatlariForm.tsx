import { useState } from 'react';
import { Plus, Trash2, Pencil, TrendingUp, DollarSign, X } from 'lucide-react';
import type { DavrXarajatlari, DavrXarajat } from '../../types';

interface DavrXarajatlariFormProps {
    data: DavrXarajatlari;
    onChange: (data: DavrXarajatlari) => void;
}

const defaultExpenses: Omit<DavrXarajat, 'id'>[] = [
    { name: 'Sotish xarajatlari', amount: 0 },
    { name: 'Reklama kontentini yaratish xarajatlari', amount: 0 },
    { name: 'Digital marketing, target xarajatlari', amount: 0 },
    { name: "Ma'muriy-boshqaruv xodimlari", amount: 0 },
];

export default function DavrXarajatlariForm({ data, onChange }: DavrXarajatlariFormProps) {
    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ name: '', amount: 0 });
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAddOrUpdate = () => {
        if (!newExpense.name.trim()) return;
        if (editingId) {
            const updated = data.expenses.map((exp) =>
                exp.id === editingId ? { ...exp, ...newExpense } : exp
            );
            onChange({ expenses: updated });
        } else {
            const expense: DavrXarajat = { id: crypto.randomUUID(), name: newExpense.name, amount: newExpense.amount };
            onChange({ expenses: [...data.expenses, expense] });
        }
        setNewExpense({ name: '', amount: 0 });
        setEditingId(null);
        setShowModal(false);
    };

    const handleEdit = (expense: DavrXarajat) => {
        setNewExpense({ name: expense.name, amount: expense.amount });
        setEditingId(expense.id);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        onChange({ expenses: data.expenses.filter((exp) => exp.id !== id) });
    };

    const handleAmountChange = (id: string, amount: number) => {
        const updated = data.expenses.map((exp) => exp.id === id ? { ...exp, amount } : exp);
        onChange({ expenses: updated });
    };

    const totalAmount = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const initializeDefaults = () => {
        const defaults: DavrXarajat[] = defaultExpenses.map((exp) => ({ id: crypto.randomUUID(), ...exp }));
        onChange({ expenses: defaults });
    };

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-title">
                    <TrendingUp size={22} />
                    <div>
                        <h2>Davr xarajatlari</h2>
                        <p className="section-subtitle">
                            Ishlab chiqarish bilan bevosita bog&apos;liq bo&apos;lmagan sotish, ma&apos;muriyat xarajatlari
                        </p>
                    </div>
                </div>
            </div>

            {data.expenses.length === 0 ? (
                <div className="empty-state">
                    <DollarSign size={44} />
                    <h3>Davr xarajatlari yo&apos;q</h3>
                    <p>Standart xarajatlarni qo&apos;shish uchun tugmani bosing</p>
                    <button className="btn btn-primary" onClick={initializeDefaults}>
                        <Plus size={18} />
                        Standart xarajatlarni qo&apos;shish
                    </button>
                </div>
            ) : (
                <>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th className="text-left">Xarajatlar nomi</th>
                                    <th style={{ width: '200px' }}>Summasi (ming so&apos;m)</th>
                                    <th style={{ width: '100px' }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.expenses.map((expense, idx) => (
                                    <tr key={expense.id}>
                                        <td>{idx + 1}</td>
                                        <td className="text-left">{expense.name}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="table-input"
                                                value={expense.amount || ''}
                                                onChange={(e) => handleAmountChange(expense.id, parseFloat(e.target.value) || 0)}
                                                min="0"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon btn-edit" onClick={() => handleEdit(expense)} title="Tahrirlash">
                                                    <Pencil size={14} />
                                                </button>
                                                <button className="btn-icon btn-delete" onClick={() => handleDelete(expense.id)} title="O'chirish">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="total-row">
                                    <td colSpan={2} className="text-right"><strong>Jami:</strong></td>
                                    <td><strong>{totalAmount.toLocaleString('uz-UZ')}</strong></td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <button className="btn btn-secondary" onClick={() => { setNewExpense({ name: '', amount: 0 }); setEditingId(null); setShowModal(true); }}>
                        <Plus size={16} />
                        Yangi xarajat qo&apos;shish
                    </button>
                </>
            )}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingId ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Xarajat nomi</label>
                                <input type="text" className="form-input" value={newExpense.name} onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })} placeholder="Masalan: Reklama xarajatlari" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Summasi (ming so&apos;m)</label>
                                <input type="number" className="form-input" value={newExpense.amount || ''} onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })} min="0" placeholder="0" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
                            <button className="btn btn-primary" onClick={handleAddOrUpdate} disabled={!newExpense.name.trim()}>
                                {editingId ? 'Saqlash' : "Qo'shish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
