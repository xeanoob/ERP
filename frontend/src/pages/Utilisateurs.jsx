import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, UserCheck, UserX, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = '/api';

const ROLES = [
    { value: 'vendeur', label: 'Vendeur', desc: 'Accès ventes et catalogue' },
    { value: 'stock', label: 'Responsable Stock', desc: 'Accès inventaire et fournisseurs' },
    { value: 'manager', label: 'Manager', desc: 'Accès complet + gestion utilisateurs' },
];

const roleBadge = (role) => {
    const styles = {
        manager: 'bg-purple-50 text-purple-700 border-purple-200',
        stock: 'bg-blue-50 text-blue-700 border-blue-200',
        vendeur: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return styles[role] || styles.vendeur;
};

const Utilisateurs = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'vendeur' });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await axios.post(`${API_URL}/users`, form);
            setForm({ nom: '', email: '', mot_de_passe: '', role: 'vendeur' });
            setShowForm(false);
            setMessage({ type: 'success', text: 'Utilisateur créé avec succès.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Erreur' });
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole });
            fetchUsers();
        } catch (err) { console.error(err); }
    };

    const handleToggle = async (userId) => {
        try {
            await axios.put(`${API_URL}/users/${userId}/toggle`);
            fetchUsers();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Gestion des Utilisateurs</h2>
                    <p className="text-sm text-gray-500">Créer des comptes et gérer les droits d'accès.</p>
                </div>
                <div className="flex items-center gap-3">
                    {message.text && (
                        <span className={`text-xs font-medium px-2 py-1 rounded border ${message.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
                            }`}>{message.text}</span>
                    )}
                    <button onClick={() => setShowForm(!showForm)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Nouvel Utilisateur
                    </button>
                </div>
            </div>

            {/* Légende des rôles */}
            <div className="pro-card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôles disponibles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ROLES.map(r => (
                        <div key={r.value} className="flex items-start gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${roleBadge(r.value)} shrink-0 mt-0.5`}>{r.label}</span>
                            <span className="text-xs text-gray-500">{r.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Formulaire de création */}
            {showForm && (
                <div className="pro-card p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Créer un compte</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom complet *</label>
                            <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required placeholder="Jean Dupont"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="jean@erp.local"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe *</label>
                            <input type="password" value={form.mot_de_passe} onChange={e => setForm({ ...form, mot_de_passe: e.target.value })} required placeholder="••••••••"
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Rôle</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900">
                                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2 flex gap-2 pt-2">
                            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800">Créer le compte</button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Chargement...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Aucun utilisateur.</td></tr>
                            ) : users.map(u => {
                                const isSelf = u.id === currentUser?.id;
                                return (
                                    <tr key={u.id} className={`transition-colors ${!u.actif ? 'opacity-50' : 'hover:bg-gray-50/50'}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                                                    {u.nom?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {u.nom} {isSelf && <span className="text-xs text-gray-400">(vous)</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                                        <td className="px-4 py-3">
                                            {isSelf ? (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${roleBadge(u.role)}`}>
                                                    {ROLES.find(r => r.value === u.role)?.label || u.role}
                                                </span>
                                            ) : (
                                                <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                                                    className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer">
                                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {u.actif ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">Actif</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Désactivé</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {!isSelf && (
                                                <button onClick={() => handleToggle(u.id)}
                                                    className={`p-1.5 rounded transition-colors ${u.actif ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                    title={u.actif ? 'Désactiver' : 'Réactiver'}>
                                                    {u.actif ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Utilisateurs;
