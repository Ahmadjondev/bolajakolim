import { useState } from 'react';
import { Plus, Trash2, Pencil, ShoppingBag, Calendar, X } from 'lucide-react';
import type { SotishRejasi, SotishMahsulot, SotishRejasiYil } from '../../types';

interface SotishRejasiFormProps {
    data: SotishRejasi;
    onChange: (data: SotishRejasi) => void;
    projectDurationYears: number;
}

const emptyProduct: Omit<SotishMahsulot, 'id'> = {
    name: '',
    unit: 'dona',
    quantity: 0,
    price: 0,
};

export default function SotishRejasiForm({ data, onChange, projectDurationYears }: SotishRejasiFormProps) {
    const [showModal, setShowModal] = useState(false);
    const [activeYear, setActiveYear] = useState(1);
    const [newProduct, setNewProduct] = useState<Omit<SotishMahsulot, 'id'>>(emptyProduct);
    const [editingId, setEditingId] = useState<string | null>(null);

    const initializeYears = () => {
        const years: SotishRejasiYil[] = [];
        for (let i = 1; i <= projectDurationYears; i++) {
            const existingYear = data.years.find((y) => y.year === i);
            years.push(existingYear || { year: i, products: [] });
        }
        onChange({ years });
    };

    const currentYearData = data.years.find((y) => y.year === activeYear) || { year: activeYear, products: [] };

    const handleAddOrUpdate = () => {
        if (!newProduct.name.trim()) return;
        const updatedYears = data.years.map((yearData) => {
            if (yearData.year !== activeYear) return yearData;
            if (editingId) {
                return { ...yearData, products: yearData.products.map((p) => p.id === editingId ? { ...p, ...newProduct } : p) };
            } else {
                return { ...yearData, products: [...yearData.products, { id: crypto.randomUUID(), ...newProduct }] };
            }
        });
        if (!data.years.find((y) => y.year === activeYear)) {
            updatedYears.push({ year: activeYear, products: [{ id: crypto.randomUUID(), ...newProduct }] });
        }
        onChange({ years: updatedYears });
        setNewProduct(emptyProduct);
        setEditingId(null);
        setShowModal(false);
    };

    const handleEdit = (product: SotishMahsulot) => {
        setNewProduct({ name: product.name, unit: product.unit, quantity: product.quantity, price: product.price });
        setEditingId(product.id);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        const updatedYears = data.years.map((yearData) => {
            if (yearData.year !== activeYear) return yearData;
            return { ...yearData, products: yearData.products.filter((p) => p.id !== id) };
        });
        onChange({ years: updatedYears });
    };

    const handleProductChange = (id: string, field: keyof SotishMahsulot, value: string | number) => {
        const updatedYears = data.years.map((yearData) => {
            if (yearData.year !== activeYear) return yearData;
            return { ...yearData, products: yearData.products.map((p) => p.id === id ? { ...p, [field]: value } : p) };
        });
        onChange({ years: updatedYears });
    };

    const calculateTotal = (products: SotishMahsulot[]) => products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const calculateTotalQuantity = (products: SotishMahsulot[]) => products.reduce((sum, p) => sum + p.quantity, 0);

    const yearTabs = Array.from({ length: projectDurationYears }, (_, i) => i + 1);

    return (
        <div className="form-section">
            <div className="section-header">
                <div className="section-title">
                    <ShoppingBag size={22} />
                    <div>
                        <h2>Sotish rejasi</h2>
                        <p className="section-subtitle">Xaridorlar haqida ma&apos;lumotlar, sotiladigan mahsulotning turi, hajmi va qiymati</p>
                    </div>
                </div>
            </div>

            {data.years.length === 0 || data.years.length !== projectDurationYears ? (
                <div className="empty-state">
                    <Calendar size={44} />
                    <h3>Sotish rejasi yo&apos;q</h3>
                    <p>Loyiha muddati: {projectDurationYears} yil. Yillik rejalarni yaratish uchun tugmani bosing</p>
                    <button className="btn btn-primary" onClick={initializeYears}>
                        <Plus size={18} />
                        Yillik rejalarni yaratish
                    </button>
                </div>
            ) : (
                <>
                    <div className="tabs-container">
                        {yearTabs.map((year) => {
                            const yearData = data.years.find((y) => y.year === year);
                            const total = yearData ? calculateTotal(yearData.products) : 0;
                            return (
                                <button key={year} className={`tab ${activeYear === year ? 'active' : ''}`} onClick={() => setActiveYear(year)}>
                                    <Calendar size={14} />
                                    {year}-yil
                                    {total > 0 && <span className="tab-badge">{(total / 1000).toFixed(0)}m</span>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="year-section">
                        <h3 className="year-title">{activeYear}-yil sotish rejasi</h3>

                        {currentYearData.products.length === 0 ? (
                            <div className="empty-state small">
                                <p>Bu yil uchun mahsulotlar yo&apos;q</p>
                                <button className="btn btn-primary btn-sm" onClick={() => { setNewProduct(emptyProduct); setEditingId(null); setShowModal(true); }}>
                                    <Plus size={16} />
                                    Mahsulot qo&apos;shish
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="data-table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px' }}>#</th>
                                                <th className="text-left">Mahsulotlar nomi</th>
                                                <th style={{ width: '100px' }}>Birlik</th>
                                                <th style={{ width: '100px' }}>Miqdori</th>
                                                <th style={{ width: '130px' }}>Narxi (ming)</th>
                                                <th style={{ width: '130px' }}>Summasi (ming)</th>
                                                <th style={{ width: '80px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentYearData.products.map((product, idx) => (
                                                <tr key={product.id}>
                                                    <td>{idx + 1}</td>
                                                    <td>
                                                        <input type="text" className="table-input" style={{ textAlign: 'left' }} value={product.name} onChange={(e) => handleProductChange(product.id, 'name', e.target.value)} placeholder="Mahsulot nomi" />
                                                    </td>
                                                    <td>
                                                        <select className="table-input" value={product.unit} onChange={(e) => handleProductChange(product.id, 'unit', e.target.value)}>
                                                            <option value="dona">dona</option>
                                                            <option value="kg">kg</option>
                                                            <option value="litr">litr</option>
                                                            <option value="metr">metr</option>
                                                            <option value="komplekt">komplekt</option>
                                                            <option value="xizmat">xizmat</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input type="number" className="table-input" value={product.quantity || ''} onChange={(e) => handleProductChange(product.id, 'quantity', parseFloat(e.target.value) || 0)} min="0" placeholder="0" />
                                                    </td>
                                                    <td>
                                                        <input type="number" className="table-input" value={product.price || ''} onChange={(e) => handleProductChange(product.id, 'price', parseFloat(e.target.value) || 0)} min="0" placeholder="0" />
                                                    </td>
                                                    <td className="text-right">
                                                        <strong>{(product.quantity * product.price).toLocaleString('uz-UZ')}</strong>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button className="btn-icon btn-edit" onClick={() => handleEdit(product)} title="Tahrirlash"><Pencil size={14} /></button>
                                                            <button className="btn-icon btn-delete" onClick={() => handleDelete(product.id)} title="O'chirish"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="total-row">
                                                <td colSpan={3} className="text-right"><strong>Jami:</strong></td>
                                                <td><strong>{calculateTotalQuantity(currentYearData.products).toLocaleString('uz-UZ')}</strong></td>
                                                <td></td>
                                                <td className="text-right"><strong>{calculateTotal(currentYearData.products).toLocaleString('uz-UZ')}</strong></td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <button className="btn btn-secondary" onClick={() => { setNewProduct(emptyProduct); setEditingId(null); setShowModal(true); }}>
                                    <Plus size={16} />
                                    Mahsulot qo&apos;shish
                                </button>
                            </>
                        )}
                    </div>

                    {/* Year Summary */}
                    <div className="summary-card" style={{ marginTop: '24px' }}>
                        <h4>Barcha yillar bo&apos;yicha jami</h4>
                        {data.years.map((yearData) => (
                            <div key={yearData.year} className="summary-item">
                                <span>{yearData.year}-yil</span>
                                <span>{calculateTotal(yearData.products).toLocaleString('uz-UZ')} ming so&apos;m</span>
                            </div>
                        ))}
                        <div className="summary-item total">
                            <span>Jami</span>
                            <span>{data.years.reduce((sum, y) => sum + calculateTotal(y.products), 0).toLocaleString('uz-UZ')} ming so&apos;m</span>
                        </div>
                    </div>
                </>
            )}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingId ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Mahsulot nomi</label>
                                <input type="text" className="form-input" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Masalan: Stomatologiya xizmati" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">O&apos;lchov birligi</label>
                                    <select className="form-input form-select" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                                        <option value="dona">dona</option>
                                        <option value="kg">kg</option>
                                        <option value="litr">litr</option>
                                        <option value="metr">metr</option>
                                        <option value="komplekt">komplekt</option>
                                        <option value="xizmat">xizmat</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Miqdori</label>
                                    <input type="number" className="form-input" value={newProduct.quantity || ''} onChange={(e) => setNewProduct({ ...newProduct, quantity: parseFloat(e.target.value) || 0 })} min="0" placeholder="0" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Narxi (ming so&apos;m)</label>
                                <input type="number" className="form-input" value={newProduct.price || ''} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} min="0" placeholder="0" />
                            </div>
                            <div className="form-info">
                                <strong>Summasi:</strong> {(newProduct.quantity * newProduct.price).toLocaleString('uz-UZ')} ming so&apos;m
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
                            <button className="btn btn-primary" onClick={handleAddOrUpdate} disabled={!newProduct.name.trim()}>
                                {editingId ? 'Saqlash' : "Qo'shish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
