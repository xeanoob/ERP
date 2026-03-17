import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Layers, Percent, Search, Loader2, Star, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Configuration = () => {
    const [activeTab, setActiveTab] = useState('categories');
    const [categories, setCategories] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [lieux, setLieux] = useState([]);
    const [charges, setCharges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCat, setNewCat] = useState('');
    const [newLieu, setNewLieu] = useState('');
    const [newTax, setNewTax] = useState({ nom: '', taux: '' });
    const [newCharge, setNewCharge] = useState({ nom: '', montant: '', periode: 'mensuel' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, taxRes, lieuRes, chargeRes] = await Promise.all([
                axios.get(`${API_URL}/categories`),
                axios.get(`${API_URL}/taxes`),
                axios.get(`${API_URL}/lieux_vente`),
                axios.get(`${API_URL}/charges`)
            ]);
            setCategories(catRes.data);
            setTaxes(taxRes.data);
            setLieux(lieuRes.data);
            setCharges(chargeRes.data);
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCat.trim()) return;
        setSaving(true);
        try {
            await axios.post(`${API_URL}/categories`, { nom: newCat.trim() });
            setNewCat('');
            fetchData();
            toast.success('Catégorie ajoutée');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleAddLieu = async (e) => {
        e.preventDefault();
        if (!newLieu.trim()) return;
        setSaving(true);
        try {
            await axios.post(`${API_URL}/lieux_vente`, { nom: newLieu.trim() });
            setNewLieu('');
            fetchData();
            toast.success('Lieu de vente ajouté');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleAddTax = async (e) => {
        e.preventDefault();
        if (!newTax.nom || newTax.taux === '') return;
        setSaving(true);
        try {
            await axios.post(`${API_URL}/taxes`, { nom: newTax.nom, taux: parseFloat(newTax.taux) });
            setNewTax({ nom: '', taux: '' });
            fetchData();
            toast.success('Taxe ajoutée');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleAddCharge = async (e) => {
        e.preventDefault();
        if (!newCharge.nom || newCharge.montant === '') return;
        setSaving(true);
        try {
            await axios.post(`${API_URL}/charges`, { nom: newCharge.nom, montant: parseFloat(newCharge.montant), periode: newCharge.periode });
            setNewCharge({ nom: '', montant: '', periode: 'mensuel' });
            fetchData();
            toast.success('Charge ajoutée');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Archiver cette catégorie ?')) return;
        try {
            await axios.delete(`${API_URL}/categories/${id}`);
            fetchData();
            toast.success('Catégorie archivée');
        } catch (err) {
            toast.error('Erreur');
        }
    };

    const handleDeleteLieu = async (id) => {
        if (!window.confirm('Archiver ce lieu de vente ?')) return;
        try {
            await axios.delete(`${API_URL}/lieux_vente/${id}`);
            fetchData();
            toast.success('Lieu de vente archivé');
        } catch (err) {
            toast.error('Erreur');
        }
    };

    const handleDeleteCharge = async (id) => {
        if (!window.confirm('Archiver cette charge fixe ?')) return;
        try {
            await axios.delete(`${API_URL}/charges/${id}`);
            fetchData();
            toast.success('Charge archivée');
        } catch (err) {
            toast.error('Erreur');
        }
    };

    const handleDeleteTax = async (id) => {
        if (!window.confirm('Archiver cette taxe ?')) return;
        try {
            await axios.delete(`${API_URL}/taxes/${id}`);
            fetchData();
            toast.success('Taxe archivée');
        } catch (err) {
            toast.error('Erreur');
        }
    };

    const handleSetDefaultTax = async (id) => {
        try {
            await axios.put(`${API_URL}/taxes/${id}/default`);
            fetchData();
            toast.success('Taxe définie par défaut');
        } catch (err) {
            toast.error('Erreur lors de la définition de la taxe par défaut');
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Configuration</h2>
                    <p className="text-sm text-gray-500">Gérez vos catégories de produits et vos taxes.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'categories' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                        } flex items-center gap-2`}
                >
                    <Layers className="w-4 h-4" />
                    Catégories
                </button>
                <button
                    onClick={() => setActiveTab('taxes')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'taxes' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                        } flex items-center gap-2`}
                >
                    <Percent className="w-4 h-4" />
                    Taxes
                </button>
                <button
                    onClick={() => setActiveTab('lieux')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'lieux' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                        } flex items-center gap-2`}
                >
                    <MapPin className="w-4 h-4" />
                    Lieux de Vente
                </button>
                <button
                    onClick={() => setActiveTab('charges')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'charges' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
                        } flex items-center gap-2`}
                >
                    <Layers className="w-4 h-4" />
                    Charges Fixes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Column */}
                <div className="md:col-span-1">
                    <div className="pro-card p-5 sticky top-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">
                            Ajouter {activeTab === 'categories' ? 'une catégorie' : activeTab === 'lieux' ? 'un lieu de vente' : activeTab === 'charges' ? 'une charge' : 'une taxe'}
                        </h3>

                        {activeTab === 'categories' ? (
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la catégorie</label>
                                    <input
                                        type="text"
                                        value={newCat}
                                        onChange={(e) => setNewCat(e.target.value)}
                                        placeholder="Ex: Fruits"
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Ajouter
                                </button>
                            </form>
                        ) : activeTab === 'lieux' ? (
                            <form onSubmit={handleAddLieu} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom du lieu</label>
                                    <input
                                        type="text"
                                        value={newLieu}
                                        onChange={(e) => setNewLieu(e.target.value)}
                                        placeholder="Ex: Marché de la Gare"
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Ajouter
                                </button>
                            </form>
                        ) : activeTab === 'taxes' ? (
                            <form onSubmit={handleAddTax} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la taxe</label>
                                    <input
                                        type="text"
                                        value={newTax.nom}
                                        onChange={(e) => setNewTax({ ...newTax, nom: e.target.value })}
                                        placeholder="Ex: TVA 20%"
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Taux (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newTax.taux}
                                            onChange={(e) => setNewTax({ ...newTax, taux: e.target.value })}
                                            placeholder="20.00"
                                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                                            required
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Ajouter
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleAddCharge} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nom (ex: Loyer, Salaire...)</label>
                                    <input
                                        type="text"
                                        value={newCharge.nom}
                                        onChange={(e) => setNewCharge({ ...newCharge, nom: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Montant (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newCharge.montant}
                                        onChange={(e) => setNewCharge({ ...newCharge, montant: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Période</label>
                                    <select
                                        value={newCharge.periode}
                                        onChange={(e) => setNewCharge({ ...newCharge, periode: e.target.value })}
                                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                                    >
                                        <option value="mensuel">Mensuel</option>
                                        <option value="jour">Par Jour</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Ajouter
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* List Column */}
                <div className="md:col-span-2">
                    <div className="pro-card min-h-[400px]">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {activeTab === 'categories' ? 'Liste des Catégories' : activeTab === 'lieux' ? 'Lieux de Vente' : activeTab === 'charges' ? 'Vos Charges Fixes' : 'Liste des Taxes'}
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {activeTab === 'categories' ? categories.length : activeTab === 'lieux' ? lieux.length : activeTab === 'charges' ? charges.length : taxes.length} élément(s)
                            </span>
                        </div>

                        {loading ? (
                            <div className="p-12 flex justify-center">
                                <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {activeTab === 'categories' ? (
                                    categories.length === 0 ? (
                                        <div className="p-12 text-center text-sm text-gray-400">Aucune catégorie.</div>
                                    ) : (
                                        categories.map(c => (
                                            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{c.nom}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">ID: {c.id}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCategory(c.id)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )
                                ) : activeTab === 'lieux' ? (
                                    lieux.length === 0 ? (
                                        <div className="p-12 text-center text-sm text-gray-400">Aucun lieu de vente.</div>
                                    ) : (
                                        lieux.map(l => (
                                            <div key={l.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{l.nom}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">ID: {l.id}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteLieu(l.id)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )
                                ) : activeTab === 'charges' ? (
                                    charges.length === 0 ? (
                                        <div className="p-12 text-center text-sm text-gray-400">Aucune charge fixe.</div>
                                    ) : (
                                        charges.map(c => (
                                            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{c.nom}</div>
                                                    <div className="text-xs text-gray-500 font-medium">{parseFloat(c.montant).toFixed(2)} € / {c.periode === 'jour' ? 'Jour' : 'Mois'}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCharge(c.id)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )
                                ) : (
                                    taxes.length === 0 ? (
                                        <div className="p-12 text-center text-sm text-gray-400">Aucune taxe configurée.</div>
                                    ) : (
                                        taxes.map(t => (
                                            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-medium text-gray-900">{t.nom}</div>
                                                        {t.is_default && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                                                PAR DÉFAUT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-blue-600 font-semibold">{t.taux}%</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!t.is_default && (
                                                        <button
                                                            onClick={() => handleSetDefaultTax(t.id)}
                                                            className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Définir comme taxe par défaut"
                                                        >
                                                            <Star className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteTax(t.id)}
                                                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Configuration;
