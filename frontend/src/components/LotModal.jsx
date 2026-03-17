import React from 'react';
import { Plus, X } from 'lucide-react';

const LotModal = ({ show, onHide, newLot, setNewLot, products, fournisseurs, onAddLot }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Nouvelle Entrée de Lot</h3>
                </div>
                <form onSubmit={onAddLot} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Produit *</label>
                        <select className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none"
                            value={newLot.produit_id} onChange={e => setNewLot({ ...newLot, produit_id: e.target.value })} required>
                            <option value="" disabled>Sélectionner...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.categorie})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fournisseur</label>
                        <select className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none"
                            value={newLot.fournisseur_id} onChange={e => setNewLot({ ...newLot, fournisseur_id: e.target.value })}>
                            <option value="">(Aucun)</option>
                            {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Qté achetée</label>
                            <input type="number" step="0.01" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none"
                                value={newLot.quantite_achetee} onChange={e => setNewLot({ ...newLot, quantite_achetee: e.target.value })} placeholder="0.00" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">P.U Achat (€)</label>
                            <input type="number" step="0.01" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-gray-900 outline-none"
                                value={newLot.prix_achat_unitaire} onChange={e => setNewLot({ ...newLot, prix_achat_unitaire: e.target.value })} placeholder="0.00" required />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Valider</button>
                        <button type="button" onClick={onHide} className="flex-1 bg-white border border-gray-200 text-gray-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LotModal;
