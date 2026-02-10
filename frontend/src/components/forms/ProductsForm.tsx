import { useState } from 'react';
import { Plus, Pencil, Trash2, ShoppingCart, X, Info } from 'lucide-react';
import type { Product } from '../../types';

interface ProductsFormProps {
    data: Product[];
    onChange: (data: Product[]) => void;
}

interface ModalState {
    isOpen: boolean;
    editIndex: number | null;
}

const initialProduct: Omit<Product, 'id'> = {
    name: '',
    quantity: 1,
};

export default function ProductsForm({ data, onChange }: ProductsFormProps) {
    const [modal, setModal] = useState<ModalState>({ isOpen: false, editIndex: null });
    const [formProduct, setFormProduct] = useState<Omit<Product, 'id'>>(initialProduct);

    const openModal = (editIndex: number | null = null) => {
        if (editIndex !== null) {
            const product = data[editIndex];
            setFormProduct({ name: product.name, quantity: product.quantity });
        } else {
            setFormProduct(initialProduct);
        }
        setModal({ isOpen: true, editIndex });
    };

    const closeModal = () => {
        setModal({ isOpen: false, editIndex: null });
        setFormProduct(initialProduct);
    };

    const handleSave = () => {
        const newProduct: Product = {
            id: modal.editIndex !== null ? data[modal.editIndex].id : Date.now().toString(),
            ...formProduct,
        };

        if (modal.editIndex !== null) {
            const updated = [...data];
            updated[modal.editIndex] = newProduct;
            onChange(updated);
        } else {
            onChange([...data, newProduct]);
        }
        closeModal();
    };

    const handleDelete = (index: number) => {
        if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
            onChange(data.filter((_, i) => i !== index));
        }
    };

    const totalProducts = data.reduce((sum, p) => sum + p.quantity, 0);

    return (
        <div>
            {/* Summary */}
            <div className="summary-section">
                <h3 className="summary-title">
                    <ShoppingCart size={18} />
                    Mahsulotlar xulosasi
                </h3>
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-label">Mahsulot turlari</div>
                        <div className="summary-value">
                            {data.length}
                            <span className="summary-unit"> ta</span>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-label">Jami mahsulotlar</div>
                        <div className="summary-value">
                            {totalProducts}
                            <span className="summary-unit"> dona</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <ShoppingCart size={18} />
                        Mahsulotlar
                    </h2>
                    <p className="card-subtitle">
                        Ishlab chiqariladigan mahsulot yoki xizmatlarni kiriting
                    </p>
                </div>

                <div className="item-list">
                    {data.map((product, idx) => (
                        <div key={product.id} className="item-card">
                            <div className="item-card-header">
                                <span className="item-card-title">{product.name}</span>
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
                                    <span className="item-stat-label">Mahsulot soni</span>
                                    <span className="item-stat-value">{product.quantity} dona</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {data.length === 0 && (
                    <div className="empty-state small">
                        <ShoppingCart size={40} />
                        <p>Hali mahsulot qo&apos;shilmagan</p>
                    </div>
                )}

                <button className="add-button" onClick={() => openModal()}>
                    <Plus size={18} />
                    Mahsulot qo&apos;shish
                </button>

                {data.length > 0 && (
                    <div className="form-info" style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p>
                                <strong>Eslatma:</strong> Har bir mahsulot alohida ko&apos;rsatiladi. Tannarx avtomatik ravishda
                                ishlab chiqarish xarajatlaridan kelib chiqqan holda hisoblanadi.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal.isOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {modal.editIndex !== null ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
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
                                    placeholder="Masalan: Stomatologiya klinikalari uchun obuna"
                                    value={formProduct.name}
                                    onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mahsulot soni</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={formProduct.quantity}
                                    onChange={(e) => setFormProduct({ ...formProduct, quantity: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={closeModal}>Bekor qilish</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!formProduct.name}>Saqlash</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
