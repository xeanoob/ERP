import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Catalogue = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newProduct, setNewProduct] = useState({ nom: '', categorie: '', variete: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/products`);
            setProducts(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newProduct.nom || !newProduct.categorie) return;
        try {
            await axios.post(`${API_URL}/products`, newProduct);
            setNewProduct({ nom: '', categorie: '', variete: '' });
            fetchProducts();
            setMessage('Produit ajouté avec succès');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Erreur lors de l\'ajout');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Confirmer l\'archivage de ce produit ?')) return;
        try {
            await axios.delete(`${API_URL}/products/${id}`);
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">

            {/* Action Bar / Form */}
            <div className="pro-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Nouveau Produit</h3>
                    {message && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">{message}</span>}
                </div>

                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                        <input
                            type="text"
                            value={newProduct.nom}
                            onChange={e => setNewProduct({ ...newProduct, nom: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                            placeholder="Ex: Pomme Golden"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                        <select
                            value={newProduct.categorie}
                            onChange={e => setNewProduct({ ...newProduct, categorie: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        >
                            <option value="" disabled>Sélectionner...</option>
                            <option value="Fruits">Fruits</option>
                            <option value="Légumes">Légumes</option>
                            <option value="Herbes">Herbes</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Variété <span className="text-gray-400 font-normal">(Optionnel)</span></label>
                        <input
                            type="text"
                            value={newProduct.variete}
                            onChange={e => setNewProduct({ ...newProduct, variete: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                            placeholder="Ex: Golden"
                        />
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4 mr-2" /> Ajouter
                    </button>
                </form>
            </div>

            {/* Data Grid */}
            <div className="pro-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">ID</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom du Produit</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Variété</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {loading ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Chargement des données...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">Aucun produit dans le catalogue.</td></tr>
                            ) : products.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{p.id}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.nom}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${p.categorie === 'Fruits'
                                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                : 'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                            {p.categorie}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{p.variete || <span className="text-gray-400">-</span>}</td>
                                    <td className="px-4 py-3 text-sm text-right">
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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

export default Catalogue
