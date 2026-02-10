'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import {
    apiGetMe,
    apiLogin,
    apiRegister,
    clearTokens,
    type AuthUser,
} from './api';

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
    logout: () => void;
    setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setIsLoading(false);
            return;
        }
        apiGetMe()
            .then(setUser)
            .catch(() => clearTokens())
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await apiLogin({ email, password });
        setUser(res.user);
    }, []);

    const register = useCallback(
        async (email: string, password: string, firstName: string, lastName: string) => {
            const res = await apiRegister({ email, password, first_name: firstName, last_name: lastName });
            setUser(res.user);
        },
        [],
    );

    const logout = useCallback(() => {
        clearTokens();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
