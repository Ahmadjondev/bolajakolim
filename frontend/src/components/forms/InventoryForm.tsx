import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, X, ExternalLink } from 'lucide-react';
import type { InventoryItem } from '../../types';
import { formatNumber, calculateInventoryTotals } from '../../utils/calculations';

interface InventoryFormProps {
    data: InventoryItem[];
    onChange: (data: InventoryItem[]) => void;
}

interface ModalState {
    isOpen: boolean;
    editIndex: number | null;
}

const initialItem: Omit<InventoryItem, 'id'> = {
    name: '',
    description: '',
    link: '',
    unit: 'dona',
    quantity: 1,
    price: 0,
    financingSource: 'vazirlik',
};

export default function InventoryForm({ data, onChange }: InventoryFormProps) {
    const [modal, setModal] = useState<ModalState>({ isOpen: false, editIndex: null });
    const [formItem, setFormItem] = useState<Omit<InventoryItem, 'id'>>(initialItem);

    const totals = calculateInventoryTotals(data);

    const openModal = (editIndex: number | null = null) => {
        if (editIndex !== null) {
            const item = data[editIndex];
            setFormItem({
                name: item.name,
                description: item.description,
                link: item.link,
                unit: item.unit,
                quantity: item.quantity,
                price: item.price,
                financingSource: item.financingSource,
            });
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
        const newItem: InventoryItem = {
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
            {/* Summary */}
            <div className="summary-section">
                <h3 className="summary-title">
                    <Package size={18} />
                    Inventar xulosasi
                </h3>
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-label">Jami inventar</div>
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
                        <Package size={18} />
                        Inventar, texnika va jihozlar
                    </h2>
                    <p className="card-subtitle">Kompyuterlar, jihozlar va boshqa texnik vositalarni kiriting</p>
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
                                {item.description && (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '12px' }}>
                                        {item.description}
                                    </p>
                                )}
                                {item.link && (
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--primary)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}
                                    >
                                        <ExternalLink size={12} />
                                        {item.link.length > 50 ? item.link.substring(0, 50) + '...' : item.link}
                                    </a>
                                )}
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
                        <Package size={40} />
                        <p>Hali inventar qo&apos;shilmagan</p>
                    </div>
                )}

                <button className="add-button" onClick={() => openModal()}>
                    <Plus size={18} />
                    Inventar qo&apos;shish
                </button>
            </div>

            {/* Modal */}
            {modal.isOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modal.editIndex !== null ? 'Inventarni tahrirlash' : 'Yangi inventar'}
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Mahsulot nomi *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Masalan: Monoblok HP EliteOne 870 G9"
                                    value={formItem.name}
                                    onChange={(e) => setFormItem({ ...formItem, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Tavsif</label>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="Nima uchun kerak..."
                                    value={formItem.description}
                                    onChange={(e) => setFormItem({ ...formItem, description: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Havola (tijorat taklifi)</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://..."
                                    value={formItem.link}
                                    onChange={(e) => setFormItem({ ...formItem, link: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">O&apos;lchov birligi</label>
                                    <select
                                        className="form-input form-select"
                                        value={formItem.unit}
                                        onChange={(e) => setFormItem({ ...formItem, unit: e.target.value })}
                                    >
                                        <option value="dona">dona</option>
                                        <option value="komplekt">komplekt</option>
                                        <option value="set">set</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Miqdori</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="1"
                                        value={formItem.quantity}
                                        onChange={(e) => setFormItem({ ...formItem, quantity: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Birlik narxi (so&apos;m)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="0"
                                    step="1000"
                                    value={formItem.price}
                                    onChange={(e) => setFormItem({ ...formItem, price: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Moliyalashtirish manbasi</label>
                                <div className="radio-group">
                                    <div className="radio-option">
                                        <input type="radio" id="inv-vazirlik" name="inv-source" checked={formItem.financingSource === 'vazirlik'} onChange={() => setFormItem({ ...formItem, financingSource: 'vazirlik' })} />
                                        <label htmlFor="inv-vazirlik">Vazirlik</label>
                                    </div>
                                    <div className="radio-option">
                                        <input type="radio" id="inv-tashkilot" name="inv-source" checked={formItem.financingSource === 'tashkilot'} onChange={() => setFormItem({ ...formItem, financingSource: 'tashkilot' })} />
                                        <label htmlFor="inv-tashkilot">Tashkilot</label>
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
