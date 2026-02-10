import { FolderOpen } from 'lucide-react';
import type { ProjectInfo } from '../../types';

interface ProjectInfoFormProps {
    data: ProjectInfo;
    onChange: (data: ProjectInfo) => void;
}

export default function ProjectInfoForm({ data, onChange }: ProjectInfoFormProps) {
    const handleChange = (field: keyof ProjectInfo, value: string | number) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <FolderOpen size={18} />
                    Loyiha ma&apos;lumotlari
                </h2>
                <p className="card-subtitle">Loyihangiz haqida asosiy ma&apos;lumotlarni kiriting</p>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Loyiha nomi *</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Masalan: Dental Pro - CRM tizimi"
                        value={data.projectName}
                        onChange={(e) => handleChange('projectName', e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Tashkilot nomi *</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Masalan: IT Solutions LLC"
                        value={data.organizationName}
                        onChange={(e) => handleChange('organizationName', e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Loyiha muddati (yillarda) *</label>
                <select
                    className="form-input form-select"
                    value={data.projectDurationYears || 2}
                    onChange={(e) => handleChange('projectDurationYears', parseInt(e.target.value))}
                >
                    <option value={1}>1 yil</option>
                    <option value={2}>2 yil</option>
                    <option value={3}>3 yil</option>
                    <option value={4}>4 yil</option>
                    <option value={5}>5 yil</option>
                </select>
                <p className="form-hint">Loyiha muddati sotish rejasi va moliyaviy xisobot uchun ishlatiladi</p>
            </div>

            <div className="form-group">
                <label className="form-label">Loyiha tavsifi</label>
                <textarea
                    className="form-input form-textarea"
                    placeholder="Loyiha haqida qisqacha ma'lumot..."
                    value={data.projectDescription}
                    onChange={(e) => handleChange('projectDescription', e.target.value)}
                />
            </div>
        </div>
    );
}
