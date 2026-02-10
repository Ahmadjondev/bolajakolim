'use client';

import Link from 'next/link';
import {
    FileSpreadsheet,
    ArrowRight,
    Calculator,
    Zap,
    Shield,
    TrendingUp,
    Users,
    Save,
    ClipboardList,
    Download,
    Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div className="landing">
            {/* Floating orbs */}
            <div className="landing-orb landing-orb-1" />
            <div className="landing-orb landing-orb-2" />
            <div className="landing-orb landing-orb-3" />
            <div className="landing-grid" />

            <div className="landing-content">
                {/* Nav */}
                <nav className="landing-nav">
                    <div className="landing-brand">
                        <FileSpreadsheet size={22} />
                        Bolajakolim
                    </div>
                    <div className="landing-nav-links">
                        {user ? (
                            <Link href="/dashboard" className="btn btn-primary btn-sm">
                                Dashboard
                                <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">Kirish</Link>
                                <Link href="/register" className="btn btn-primary btn-sm">
                                    Boshlash
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Hero */}
                <section className="landing-hero">
                    <div className="landing-badge">
                        <Sparkles size={14} />
                        Biznes loyihalar uchun #1 platforma
                    </div>
                    <h1>Xarajatlar smetasini yarating, daqiqalar ichida</h1>
                    <p>
                        Loyihangiz uchun professional xarajatlar smetasini avtomatik hisoblang,
                        moliyaviy xisobot tuzing va Excel formatida yuklab oling.
                    </p>
                    <div className="landing-hero-actions">
                        <Link href={user ? '/create' : '/register'} className="btn btn-primary btn-lg">
                            Bepul boshlash
                            <ArrowRight size={18} />
                        </Link>
                        <a href="#how-it-works" className="btn btn-ghost btn-lg">
                            Qanday ishlaydi?
                        </a>
                    </div>

                    {/* Preview mockup */}
                    <div className="landing-preview">
                        <div className="landing-preview-bar">
                            <div className="landing-preview-dot" />
                            <div className="landing-preview-dot" />
                            <div className="landing-preview-dot" />
                        </div>
                        <div className="landing-preview-content">
                            <div className="landing-preview-row">
                                <div className="landing-preview-cell wide" />
                                <div className="landing-preview-cell" />
                                <div className="landing-preview-cell narrow accent" />
                            </div>
                            <div className="landing-preview-row">
                                <div className="landing-preview-cell wide" />
                                <div className="landing-preview-cell" />
                                <div className="landing-preview-cell narrow" />
                            </div>
                            <div className="landing-preview-row">
                                <div className="landing-preview-cell wide" />
                                <div className="landing-preview-cell accent" />
                                <div className="landing-preview-cell narrow" />
                            </div>
                            <div className="landing-preview-row">
                                <div className="landing-preview-cell" />
                                <div className="landing-preview-cell wide accent" />
                                <div className="landing-preview-cell narrow" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="landing-stats">
                    <div>
                        <div className="landing-stat-value">1,200<span>+</span></div>
                        <div className="landing-stat-label">Smetalar yaratildi</div>
                    </div>
                    <div>
                        <div className="landing-stat-value">300<span>+</span></div>
                        <div className="landing-stat-label">Tashkilotlar</div>
                    </div>
                    <div>
                        <div className="landing-stat-value">99.8<span>%</span></div>
                        <div className="landing-stat-label">Aniqlik darajasi</div>
                    </div>
                </section>

                {/* How it works */}
                <section className="landing-how" id="how-it-works">
                    <div className="landing-section-label">3 oddiy qadam</div>
                    <h2 className="landing-section-title">Qanday ishlaydi?</h2>
                    <div className="landing-steps">
                        <div className="landing-step">
                            <div className="landing-step-num">01</div>
                            <div className="landing-step-icon">
                                <ClipboardList size={24} />
                            </div>
                            <h3>Ma&apos;lumotlarni kiriting</h3>
                            <p>Ish haqi, inventar, xom ashyo va boshqa xarajatlarni qadamba-qadam to&apos;ldiring.</p>
                        </div>
                        <div className="landing-step">
                            <div className="landing-step-num">02</div>
                            <div className="landing-step-icon">
                                <Calculator size={24} />
                            </div>
                            <h3>Avtomatik hisoblang</h3>
                            <p>Tannarx, moliyaviy xisobot va foyda-zarar avtomatik hisoblanadi.</p>
                        </div>
                        <div className="landing-step">
                            <div className="landing-step-num">03</div>
                            <div className="landing-step-icon">
                                <Download size={24} />
                            </div>
                            <h3>Excel yuklab oling</h3>
                            <p>9 ta varaqdagi professional Excel faylni bir tugma bilan yuklab oling.</p>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="landing-features">
                    <div className="landing-section-label">Imkoniyatlar</div>
                    <h2 className="landing-section-title">Hamma narsa bir joyda</h2>
                    <div className="landing-features-grid">
                        <div className="landing-feature">
                            <div className="landing-feature-icon">
                                <Calculator size={20} />
                            </div>
                            <h3>9 ta jadvalda hisob-kitob</h3>
                            <p>Ish haqi, inventar, xom ashyo, tannarx, sotish rejasi va moliyaviy xisobot.</p>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon green">
                                <Zap size={20} />
                            </div>
                            <h3>Tezkor Excel eksport</h3>
                            <p>Professional Excel faylni serverda yoki brauzerda bir lahzada yarating.</p>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon violet">
                                <Save size={20} />
                            </div>
                            <h3>Qoralama saqlash</h3>
                            <p>Ishingizni istalgan vaqtda saqlang va keyinroq davom ettiring.</p>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon cyan">
                                <TrendingUp size={20} />
                            </div>
                            <h3>Moliyaviy xisobot</h3>
                            <p>Yillik foyda-zarar hisoboti avtomatik tuziladi.</p>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon amber">
                                <Shield size={20} />
                            </div>
                            <h3>Xavfsiz platforma</h3>
                            <p>Ma&apos;lumotlaringiz shifrlangan holda xavfsiz saqlanadi.</p>
                        </div>
                        <div className="landing-feature">
                            <div className="landing-feature-icon">
                                <Users size={20} />
                            </div>
                            <h3>Kooperativ moliyalashtirish</h3>
                            <p>Vazirlik va tashkilot manbalarini alohida boshqaring.</p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="landing-cta">
                    <div className="landing-cta-card">
                        <h2>Hoziroq boshlang</h2>
                        <p>Birinchi smetangizni yarating — bepul va tezkor.</p>
                        <Link href={user ? '/create' : '/register'} className="btn btn-primary btn-lg">
                            Bepul ro&apos;yxatdan o&apos;ting
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="landing-footer">
                    Bolajakolim &copy; {new Date().getFullYear()}. Barcha huquqlar himoyalangan.
                </footer>
            </div>
        </div>
    );
}
