import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Sorties = () => {
    const [products, setProducts] = useState([]);
    const [lieux, setLieux] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ produit_id: '', quantite_sortie: '', prix_reel: '', lieu_vente_id: '', type: 'vente' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [resProd, resLieux] = await Promise.all([
                axios.get(`${API_URL}/products`),
                axios.get(`${API_URL}/lieux_vente`)
            ]);
            setProducts(resProd.data.data || resProd.data);
            setLieux(resLieux.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/sales`, form);
            setForm({ produit_id: '', quantite_sortie: '', prix_reel: '', lieu_vente_id: '' });
            toast.success('Vente enregistrée avec succès !');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur lors de la vente');
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 font-mono tracking-tight uppercase">Sortie de Stock</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Enregistrer une nouvelle vente</p>
                </div>
                {message && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded text-green-700 text-xs font-bold animate-in fade-in duration-300">
                        <CheckCircle2 className="w-4 h-4" /> {message}
                    </div>
                )}
            </div>

            <div className="pro-card p-4 border-l-4 border-gray-900 mb-2 sm:mb-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Transaction</p>
                <p className="text-2xl font-mono font-bold text-gray-900">
                    {((parseFloat(form.quantite_sortie) || 0) * (parseFloat(form.prix_reel) || 0)).toFixed(2)} €
                </p>
            </div>

            <div className="pro-card p-6">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Produit</label>
                        <select
                            required
                            value={form.produit_id}
                            onChange={e => {
                                const p = products.find(x => x.id === parseInt(e.target.value));
                                setForm({ ...form, produit_id: e.target.value, prix_reel: p?.prix_actif || '' });
                            }}
                            className="w-full bg-white border-2 border-gray-100 rounded px-4 py-3 text-sm font-medium focus:border-gray-900 focus:outline-none transition-colors"
                        >
                            <option value="">Sélectionner un produit...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id} disabled={parseFloat(p.quantite_stock) <= 0}>
                                    {p.nom} {p.origine ? `(${p.origine})` : ''} — Stock: {parseFloat(p.quantite_stock).toFixed(1)} {p.unite || 'kg'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Lieu de Vente (Optionnel)</label>
                        <select
                            value={form.lieu_vente_id}
                            onChange={e => setForm({ ...form, lieu_vente_id: e.target.value })}
                            className="w-full bg-white border-2 border-gray-100 rounded px-4 py-3 text-sm font-medium focus:border-gray-900 focus:outline-none transition-colors"
                        >
                            <option value="">Sélectionner un lieu...</option>
                            {lieux.map(l => (
                                <option key={l.id} value={l.id}>{l.nom}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quantité sortie</label>
                        <input
                            type="number"
                            step="0.1"
                            required
                            value={form.quantite_sortie}
                            onChange={e => setForm({ ...form, quantite_sortie: e.target.value })}
                            placeholder="0.0"
                            className="w-full bg-white border-2 border-gray-100 rounded px-4 py-3 text-sm font-mono focus:border-gray-900 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prix de Vente Unitaire (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={form.prix_reel}
                            onChange={e => setForm({ ...form, prix_reel: e.target.value })}
                            placeholder="0.00"
                            className="w-full bg-white border-2 border-gray-100 rounded px-4 py-3 text-sm font-mono focus:border-gray-900 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="sm:col-span-2 pt-4">
                        <button
                            type="submit"
                            className="w-full text-white py-4 rounded font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-[0.98] bg-gray-900 hover:bg-black"
                        >
                            Valider la Vente
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default Sorties;
