import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Alertes = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/lots/stock`);
            setProducts(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const startEdit = (p) => {
        setEditingId(p.id);
        setEditValue(parseFloat(p.seuil_alerte_stock || 10).toString());
    };

    const cancelEdit = () => { setEditingId(null); setEditValue(''); };

    const saveEdit = async (product) => {
        try {
            await axios.put(`${API_URL}/products/${product.id}`, {
                nom: product.nom,
                categorie: product.categorie,
                origine: product.origine || '',
                unite: product.unite || 'kg',
                prix_actif: product.prix_actif,
                seuil_alerte_stock: parseFloat(editValue)
            });
            setEditingId(null);
            setMessage(`Seuil de "${product.nom}" mis à jour`);
            setTimeout(() => setMessage(''), 3000);
            fetchProducts();
        } catch (err) { console.error(err); }
    };

    const handleKeyDown = (e, product) => {
        if (e.key === 'Enter') saveEdit(product);
        if (e.key === 'Escape') cancelEdit();
    };

    const alertCount = products.filter(p => parseFloat(p.quantite_stock) <= parseFloat(p.seuil_alerte_stock || 10)).length;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Seuils d'Alerte d'Approvisionnement</h2>
                    <p className="text-sm text-gray-500">Configurez le seuil minimum pour chaque produit. Une alerte se déclenche quand le stock passe en dessous.</p>
                </div>
                {message && <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-md border border-green-200">{message}</span>}
            </div>

            {alertCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span className="text-sm text-red-700 font-medium">{alertCount} produit(s) en dessous du seuil d'alerte</span>
                </div>
            )}

            <div className="mobile-card-grid">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="pro-card p-4 space-y-3">
                            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-gray-50 rounded w-1/2 animate-pulse" />
                        </div>
                    ))
                ) : products.length === 0 ? (
                    <div className="pro-card p-8 text-center text-sm text-gray-400">Aucun produit.</div>
                ) : products.map(p => {
                    const qty = parseFloat(p.quantite_stock);
                    const seuil = parseFloat(p.seuil_alerte_stock || 10);
                    const isLow = qty <= seuil;
                    const isCritical = qty <= seuil * 0.5;
                    const isEditing = editingId === p.id;

                    return (
                        <div key={p.id} className={`pro-card p-4 flex flex-col gap-3 ${isLow ? 'border-red-200 bg-red-50/20' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{p.nom}</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{p.categorie_nom || '-'}</p>
                                </div>
                                {isCritical ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CRITIQUE</span>
                                ) : isLow ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">BAS</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">OK</span>
                                )}
                            </div>

                            <div className="flex items-end justify-between border-t border-gray-100 pt-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock Actuel</p>
                                    <p className={`text-lg font-mono font-bold ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                                        {qty.toFixed(1)} <span className="text-xs font-sans text-gray-400 font-normal">{p.unite || 'kg'}</span>
                                    </p>
                                </div>

                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seuil d'Alerte</p>
                                    {isEditing ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number" step="1" min="0"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                                onKeyDown={e => handleKeyDown(e, p)}
                                                autoFocus
                                                className="w-16 bg-white border-2 border-gray-900 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none"
                                            />
                                            <button onClick={() => saveEdit(p)} className="p-1 text-green-600"><Check className="w-4 h-4" /></button>
                                            <button onClick={cancelEdit} className="p-1 text-gray-400"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end gap-2 group">
                                            <span className="text-sm font-bold text-gray-700">{seuil.toFixed(0)} <span className="text-xs font-normal text-gray-400">{p.unite || 'kg'}</span></span>
                                            <button onClick={() => startEdit(p)} className="text-[10px] font-bold text-blue-600 uppercase underline decoration-blue-200">Modifier</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="desktop-table-container">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Stock Actuel</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Seuil d'Alerte</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Statut</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Chargement...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Aucun produit.</td></tr>
                            ) : products.map(p => {
                                const qty = parseFloat(p.quantite_stock);
                                const seuil = parseFloat(p.seuil_alerte_stock || 10);
                                const isLow = qty <= seuil;
                                const isCritical = qty <= seuil * 0.5;
                                const isEditing = editingId === p.id;

                                return (
                                    <tr key={p.id} className={`transition-colors ${isLow ? 'bg-red-50/40' : 'hover:bg-gray-50/50'}`}>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{p.nom}</div>
                                            <div className="text-xs text-gray-500">{p.categorie_nom || '-'}{p.origine ? ` — ${p.origine}` : ''}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">
                                            <span className={isCritical ? 'text-red-600 font-bold' : isLow ? 'text-amber-600' : 'text-gray-900'}>
                                                {qty.toFixed(1)} {p.unite || 'kg'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number" step="1" min="0"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    onKeyDown={e => handleKeyDown(e, p)}
                                                    autoFocus
                                                    className="w-20 bg-white border-2 border-gray-900 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none ml-auto block"
                                                />
                                            ) : (
                                                <span className="text-gray-700 font-medium">{seuil.toFixed(0)} {p.unite || 'kg'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isCritical ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">CRITIQUE</span>
                                            ) : isLow ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">BAS</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">OK</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => saveEdit(p)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Valider">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition-colors" title="Annuler">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(p)}
                                                    className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                                                    Modifier
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

export default Alertes;
