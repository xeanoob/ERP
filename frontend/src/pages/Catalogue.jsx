import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2 } from 'lucide-react';

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
        try {
            if (!newProduct.nom || !newProduct.categorie) return;
            await axios.post(`${API_URL}/products`, newProduct);
            setNewProduct({ nom: '', categorie: '', variete: '' });
            fetchProducts();
            setMessage('Produit ajouté !');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Voulez-vous vraiment archiver ce produit ?')) return;
        try {
            await axios.delete(`${API_URL}/products/${id}`);
            fetchProducts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            {/* Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Ajouter un produit</h3>
                <form onSubmit={handleCreate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
                        <input
                            type="text"
                            value={newProduct.nom}
                            onChange={e => setNewProduct({ ...newProduct, nom: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Ex: Pomme Golden"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                        <select
                            value={newProduct.categorie}
                            onChange={e => setNewProduct({ ...newProduct, categorie: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">Sélectionner...</option>
                            <option value="Fruits">Fruits</option>
                            <option value="Légumes">Légumes</option>
                            <option value="Herbes">Herbes</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Variété (Optionnel)</label>
                        <input
                            type="text"
                            value={newProduct.variete}
                            onChange={e => setNewProduct({ ...newProduct, variete: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Ex: Golden"
                        />
                    </div>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
                        <Plus className="w-4 h-4 mr-2" /> Ajouter
                    </button>
                </form>
                {message && <p className="text-green-600 mt-2 text-sm">{message}</p>}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b font-medium text-gray-600">ID</th>
                            <th className="p-4 border-b font-medium text-gray-600">Nom</th>
                            <th className="p-4 border-b font-medium text-gray-600">Catégorie</th>
                            <th className="p-4 border-b font-medium text-gray-600">Variété</th>
                            <th className="p-4 border-b font-medium text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="p-4 text-center">Chargement...</td></tr>
                        ) : products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="p-4 border-b text-gray-500">#{p.id}</td>
                                <td className="p-4 border-b font-medium text-gray-800">{p.nom}</td>
                                <td className="p-4 border-b text-gray-600">
                                    <span className={`px-2 py-1 rounded-full text-xs ${p.categorie === 'Fruits' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                        {p.categorie}
                                    </span>
                                </td>
                                <td className="p-4 border-b text-gray-600">{p.variete || '-'}</td>
                                <td className="p-4 border-b text-right">
                                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Catalogue;
