import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Search } from 'lucide-react';

const API_URL = '/api';

const Fournisseurs = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nom: '', contact: '', email: '', telephone: '', adresse: '' });
    const [message, setMessage] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async (q = '') => {
        try {
            const res = await axios.get(`${API_URL}/fournisseurs`, { params: { search: q } });
            setItems(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearch(val);
        fetchData(val);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.nom) return;
        try {
            await axios.post(`${API_URL}/fournisseurs`, form);
            setForm({ nom: '', contact: '', email: '', telephone: '', adresse: '' });
            setShowForm(false);
            fetchData();
            setMessage('Fournisseur ajouté');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Archiver ce fournisseur ?')) return;
        try {
            await axios.delete(`${API_URL}/fournisseurs/${id}`);
            fetchData();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Fournisseurs</h2>
                    <p className="text-sm text-gray-500">Gérez vos partenaires d'approvisionnement.</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{message}</span>}
                    <button onClick={() => setShowForm(!showForm)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Ajouter
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="pro-card p-5">
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom *" required
                            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Contact"
                            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email"
                            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="Téléphone"
                            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
                        <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} placeholder="Adresse"
                            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 sm:col-span-2" />
                        <div className="flex gap-2 items-end">
                            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800">Enregistrer</button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={handleSearch} placeholder="Rechercher un fournisseur..."
                    className="w-full sm:w-80 bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900" />
            </div>

            {/* Table */}
            <div className="pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Chargement...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Aucun fournisseur.</td></tr>
                            ) : items.map(f => (
                                <tr key={f.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.nom}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{f.contact || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{f.email || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{f.telephone || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        <button onClick={() => handleDelete(f.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Fournisseurs;
