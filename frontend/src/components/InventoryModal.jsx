import React from 'react';
import { ClipboardList, X, AlertTriangle, Check } from 'lucide-react';

const InventoryModal = ({ show, onHide, stocks, inventoryCounts, setInventoryCounts, isSubmitting, onSubmit }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[60] animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xl max-h-[90vh] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                            Faire l'inventaire
                        </h3>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">Vérification du stock physique</p>
                    </div>
                    <button onClick={onHide} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content - To Do List */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                            Saisissez la quantité réelle constatée. Si elle est inférieure au stock théorique, une <strong>perte</strong> sera automatiquement enregistrée.
                        </p>
                    </div>

                    <div className="space-y-2">
                        {stocks.map(s => {
                            const system = parseFloat(s.quantite_stock);
                            const physical = parseFloat(inventoryCounts[s.id] || 0);
                            const diff = system - physical;
                            const isLoss = diff > 0.05;

                            return (
                                <div key={s.id} className={`flex flex-col p-4 rounded-xl border transition-all ${isLoss ? 'border-amber-200 bg-amber-50/50 shadow-sm' : 'border-gray-100 bg-white'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                                                {s.nom}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {s.origine && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.origine}</span>}
                                                <span className="text-[10px] font-bold text-gray-300">· Théorique: {system.toFixed(1)} {s.unite || 'kg'}</span>
                                            </div>
                                        </div>
                                        {isLoss && (
                                            <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                Perte: -{diff.toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-900/5 transition-all">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={inventoryCounts[s.id] || ''}
                                            onChange={e => setInventoryCounts({ ...inventoryCounts, [s.id]: e.target.value })}
                                            className="flex-1 px-3 py-2.5 text-sm font-black font-mono text-gray-900 bg-transparent focus:outline-none"
                                            placeholder="Saisir stock physique..."
                                        />
                                        <span className="px-4 text-[10px] font-black text-gray-400 bg-gray-100/50 border-l border-gray-200 uppercase tracking-widest flex items-center">
                                            {s.unite || 'kg'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onHide}
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting}
                        className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white rounded-md transition-all shadow-lg flex items-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black active:scale-95'}`}
                    >
                        {isSubmitting ? 'Enregistrement...' : (
                            <>
                                <Check className="w-4 h-4" />
                                Valider l'Inventaire
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;
