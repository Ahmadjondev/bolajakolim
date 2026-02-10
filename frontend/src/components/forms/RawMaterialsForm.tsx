import { useState } from 'react';
import { Plus, Pencil, Trash2, Boxes, X } from 'lucide-react';
import type { RawMaterial } from '../../types';
import { formatNumber, calculateRawMaterialsTotals } from '../../utils/calculations';

interface RawMaterialsFormProps {
    data: RawMaterial[];
    onChange: (data: RawMaterial[]) => void;
}

interface ModalState {
    isOpen: boolean;
    editIndex: number | null;
}

const initialItem: Omit<RawMaterial, 'id'> = {
    name: '',
    unit: 'dona',
    quantity: 1,
    price: 0,
    financingSource: 'vazirlik',
};

export default function RawMaterialsForm({ data, onChange }: RawMaterialsFormProps) {
    const [modal, setModal] = useState<ModalState>({ isOpen: false, editIndex: null });
    const [formItem, setFormItem] = useState<Omit<RawMaterial, 'id'>>(initialItem);

    const totals = calculateRawMaterialsTotals(data);

    const openModal = (editIndex: number | null = null) => {
        if (editIndex !== null) {
            const item = data[editIndex];
            setFormItem({ name: item.name, unit: item.unit, quantity: item.quantity, price: item.price, financingSource: item.financingSource });
        } else {
            setFormItem(initialItem);
        }
        setModal({ isOpen: true, editIndex });
    };

    const closeModal = () => {
        setModal({ isOpen: false, editIndex: null });
        setFormItem(initialItem);
    };

    const handleSave = () => {
        const newItem: RawMaterial = {
            id: modal.editIndex !== null ? data[modal.editIndex].id : Date.now().toString(),
            ...formItem,
        };
        if (modal.editIndex !== null) {
            const updated = [...data];
            updated[modal.editIndex] = newItem;
            onChange(updated);
        } else {
            onChange([...data, newItem]);
        }
        closeModal();
    };

    const handleDelete = (index: number) => {
        if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
            onChange(data.filter((_, i) => i !== index));
        }
    };

    return (
        <div>
            <div className="summary-section">
                <h3 className="summary-title">
                    <Boxes size={18} />
                    Xom ashyo xulosasi
                </h3>
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-label">Jami xom ashyo</div>
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

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <Boxes size={18} />
                        Xomashyo va materiallar
                    </h2>
                    <p className="card-subtitle">Ishlab chiqarish uchun kerakli xomashyo va materiallarni kiriting</p>
                </div>

                <div className="item-list">
                    {data.map((item, idx) => {
                        const total = item.price * item.quantity;
                        return (
                            <div key={item.id} className="item-card">
                                <div className="item-card-header">
                                    <span className="item-card-title">{item.name}</span>
                                    <div className="item-card-actions">
                                        <button className="btn-icon btn-edit" onClick={() => openModal(idx)}>
                                            <Pencil size={14} />
                                        </button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(idx)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="item-card-content">
                                    <div className="item-stat">
                                        <span className="item-stat-label">Birlik</span>
                                        <span className="item-stat-value">{item.unit}</span>
                                    </div>
                                    <div className="item-stat">
                                        <span className="item-stat-label">Miqdori</span>
                                        <span className="item-stat-value">{item.quantity}</span>
                                    </div>
                                    <div className="item-stat">
                                        <span className="item-stat-label">Narxi</span>
                                        <span className="item-stat-value">{formatNumber(item.price)}</span>
                                    </div>
                                    <div className="item-stat">
                                        <span className="item-stat-label">Jami</span>
                                        <span className="item-stat-value" style={{ color: 'var(--primary-light)' }}>{formatNumber(total)}</span>
                                    </div>
                                    <div className="item-stat">
                                        <span className="item-stat-label">Manba</span>
                                        <span className="item-stat-value" style={{ color: item.financingSource === 'vazirlik' ? 'var(--primary)' : 'var(--success)' }}>
                                            {item.financingSource === 'vazirlik' ? 'Vazirlik' : 'Tashkilot'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {data.length === 0 && (
                    <div className="empty-state small">
                        <Boxes size={40} />
                        <p>Hali xom ashyo qo&apos;shilmagan</p>
                    </div>
                )}

                <button className="add-button" onClick={() => openModal()}>
                    <Plus size={18} />
                    Xom ashyo qo&apos;shish
                </button>
            </div>

            {modal.isOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{modal.editIndex !== null ? 'Xom ashyoni tahrirlash' : 'Yangi xom ashyo'}</h3>
                            <button className="modal-close" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Xom ashyo nomi *</label>
                                <input type="text" className="form-input" placeholder="Masalan: Qog'oz, siyoh..." value={formItem.name} onChange={(e) => setFormItem({ ...formItem, name: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">O&apos;lchov birligi</label>
                                    <select className="form-input form-select" value={formItem.unit} onChange={(e) => setFormItem({ ...formItem, unit: e.target.value })}>
                                        <option value="dona">dona</option>
                                        <option value="kg">kg</option>
                                        <option value="litr">litr</option>
                                        <option value="metr">metr</option>
                                        <option value="komplekt">komplekt</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Miqdori</label>
                                    <input type="number" className="form-input" min="1" value={formItem.quantity} onChange={(e) => setFormItem({ ...formItem, quantity: parseInt(e.target.value) || 1 })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Birlik narxi (so&apos;m)</label>
                                <input type="number" className="form-input" min="0" step="1000" value={formItem.price} onChange={(e) => setFormItem({ ...formItem, price: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Moliyalashtirish manbasi</label>
                                <div className="radio-group">
                                    <div className="radio-option">
                                        <input type="radio" id="raw-vazirlik" name="raw-source" checked={formItem.financingSource === 'vazirlik'} onChange={() => setFormItem({ ...formItem, financingSource: 'vazirlik' })} />
                                        <label htmlFor="raw-vazirlik">Vazirlik</label>
                                    </div>
                                    <div className="radio-option">
                                        <input type="radio" id="raw-tashkilot" name="raw-source" checked={formItem.financingSource === 'tashkilot'} onChange={() => setFormItem({ ...formItem, financingSource: 'tashkilot' })} />
                                        <label htmlFor="raw-tashkilot">Tashkilot</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeModal}>Bekor qilish</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!formItem.name || formItem.price <= 0}>Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
