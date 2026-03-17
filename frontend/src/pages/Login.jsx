import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Connexion réussie !');
        } catch (err) {
            const msg = err.response?.data?.error || 'Erreur de connexion';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center p-4 overflow-auto">
            <div className="w-full max-w-sm">
                <div className="mb-10 text-center">
                    <h1 className="text-sm font-semibold text-white uppercase tracking-widest">Stocko</h1>
                    <p className="text-xs text-gray-500 mt-1">Connexion à votre espace de gestion</p>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-md p-6">
                    {error && (
                        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                                placeholder="admin@erp.local"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-xs text-gray-600 mt-6">
                    Défaut : admin@erp.local / admin123
                </p>
            </div>
        </div>
    );
};

export default Login;
