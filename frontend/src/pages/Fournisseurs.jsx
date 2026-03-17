import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Search, Pencil } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Fournisseurs = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nom: '', contact: '', email: '', telephone: '', adresse: '' });
    const [message, setMessage] = useState('');
    const [editingCell, setEditingCell] = useState(null); // { id, field }
    const [editingValue, setEditingValue] = useState('');

    const fetchData = async (q = '') => {
        try {
            const res = await axios.get(`${API_URL}/fournisseurs`, { params: { search: q } });
            setItems(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const startMobileEdit = (f) => {
        setForm({ ...f });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData(search);
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleSearch = (e) => setSearch(e.target.value);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.nom) return;
        try {
            if (form.id) {
                await axios.put(`${API_URL}/fournisseurs/${form.id}`, form);
                setMessage('Fournisseur mis à jour');
            } else {
                await axios.post(`${API_URL}/fournisseurs`, form);
                setMessage('Fournisseur ajouté');
            }
            setForm({ nom: '', contact: '', email: '', telephone: '', adresse: '' });
            setShowForm(false);
            fetchData();
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

    const startEditing = (id, field, value) => {
        setEditingCell({ id, field });
        setEditingValue(value || '');
    };

    const saveEdit = async (id) => {
        if (!editingCell) return;
        try {
            const fournisseur = items.find(i => i.id === id);
            if (!fournisseur) return;
            const updated = { ...fournisseur, [editingCell.field]: editingValue };
            await axios.put(`${API_URL}/fournisseurs/${id}`, updated);
            setItems(items.map(i => i.id === id ? updated : i));
            setEditingCell(null);
            setMessage('Mise à jour réussie');
            setTimeout(() => setMessage(''), 2500);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la mise à jour');
        }
    };

    const handleKeyDown = (e, id) => {
        if (e.key === 'Enter') saveEdit(id);
        if (e.key === 'Escape') setEditingCell(null);
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
                <div className="pro-card p-4 sm:p-5 order-first sm:order-none">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="sm:col-span-1">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nom *</label>
                                <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Maraîcher Bio" required
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contact</label>
                                <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Nom du contact"
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" type="email"
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Téléphone</label>
                                <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="06..."
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Adresse</label>
                                <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} placeholder="Adresse complète"
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="flex-1 sm:flex-none bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95">Enregistrer</button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">Annuler</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative group max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                <input value={search} onChange={handleSearch} placeholder="Rechercher un fournisseur..."
                    className="w-full bg-white border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all" />
            </div>

            {/* Mobile View */}
            <div className="sm:hidden space-y-3">
                {loading ? (
                    <div className="text-center py-10 text-gray-400 text-sm italic">Chargement...</div>
                ) : items.length === 0 ? (
                    <div className="pro-card p-8 text-center text-gray-400 text-sm">Aucun fournisseur trouvé.</div>
                ) : items.map(f => (
                    <div key={f.id} className="pro-card p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{f.nom}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{f.contact || 'No contact'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => startMobileEdit(f)} className="p-2 text-gray-400 hover:text-blue-600 active:scale-95 transition-all">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(f.id)} className="p-2 text-gray-300 hover:text-red-500 active:scale-95 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                            <div>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Téléphone</p>
                                <p className="text-xs font-medium text-gray-600 truncate">{f.telephone || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Email</p>
                                <p className="text-xs font-medium text-gray-600 truncate">{f.email || '-'}</p>
                            </div>
                        </div>
                        
                        {f.adresse && (
                            <div className="pt-1">
                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Adresse</p>
                                <p className="text-xs text-gray-500 line-clamp-1 italic">{f.adresse}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Table (Desktop only) */}
            <div className="hidden sm:block pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Nom</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Contact</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Email</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Téléphone</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-400 italic">Chargement...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-12 text-center text-gray-400">Aucun fournisseur.</td></tr>
                            ) : items.map(f => (
                                <tr key={f.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 py-4 text-sm font-bold text-gray-900" onDoubleClick={() => startEditing(f.id, 'nom', f.nom)}>
                                        {editingCell?.id === f.id && editingCell?.field === 'nom' ? (
                                            <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => handleKeyDown(e, f.id)} onBlur={() => saveEdit(f.id)} className="w-full bg-white border border-gray-900 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                        ) : f.nom}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600 font-medium" onDoubleClick={() => startEditing(f.id, 'contact', f.contact)}>
                                        {editingCell?.id === f.id && editingCell?.field === 'contact' ? (
                                            <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => handleKeyDown(e, f.id)} onBlur={() => saveEdit(f.id)} className="w-full bg-white border border-gray-900 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                        ) : f.contact || '-'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-500" onDoubleClick={() => startEditing(f.id, 'email', f.email)}>
                                        {editingCell?.id === f.id && editingCell?.field === 'email' ? (
                                            <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => handleKeyDown(e, f.id)} onBlur={() => saveEdit(f.id)} className="w-full bg-white border border-gray-900 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                        ) : f.email || '-'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-500" onDoubleClick={() => startEditing(f.id, 'telephone', f.telephone)}>
                                        {editingCell?.id === f.id && editingCell?.field === 'telephone' ? (
                                            <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => handleKeyDown(e, f.id)} onBlur={() => saveEdit(f.id)} className="w-full bg-white border border-gray-900 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" />
                                        ) : f.telephone || '-'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right">
                                        <button onClick={() => handleDelete(f.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
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
