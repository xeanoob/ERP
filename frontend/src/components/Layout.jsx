import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Truck, Users, LogOut, Bell, Settings, Clock, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    const fetchAlerts = useCallback(async () => {
        if (!user) return;
        try {
            const res = await axios.get(`${API_URL}/products/alerts`);
            setAlerts(res.data);
        } catch (err) { console.error('Error fetching alerts:', err); }
    }, [user, API_URL]);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000); // 30s
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const allNavItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['vendeur', 'stock', 'manager'] },
        { path: '/catalogue', label: 'Catalogue', icon: Package, roles: ['vendeur', 'stock', 'manager'] },
        { path: '/inventaire', label: 'Inventaire', icon: TrendingUp, roles: ['stock', 'manager'] },
        { path: '/sorties', label: 'Ventes', icon: ShoppingCart, roles: ['vendeur', 'manager'] },
        { path: '/historique', label: 'Historique', icon: Clock, roles: ['vendeur', 'manager'] },
        { path: '/fournisseurs', label: 'Fournisseurs', icon: Truck, roles: ['stock', 'manager'] },
        { path: '/alertes', label: 'Alertes', icon: Bell, roles: ['stock', 'manager'] },
        { path: '/utilisateurs', label: 'Utilisateurs', icon: Users, roles: ['manager'] },
        { path: '/configuration', label: 'Paramètres', icon: Settings, roles: ['manager'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

    // Items for bottom navigation on mobile
    const bottomNavItems = navItems.filter(item =>
        ['Dashboard', 'Catalogue', 'Ventes', 'Historique'].includes(item.label)
    );

    const NavContent = () => (
        <>
            <div className="px-5 py-6 border-b border-gray-800">
                <h1 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Mon ERP</h1>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}>
                            <Icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="px-4 py-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-400 truncate">{user?.nom}</p>
                        <p className="text-[10px] text-gray-600 truncate">{user?.role}</p>
                    </div>
                    <button onClick={logout} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors shrink-0" title="Déconnexion">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-[#F9FAFB] font-sans selection:bg-gray-200">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col w-56 bg-[#111111] shrink-0">
                <NavContent />
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#111111] flex flex-col z-50 shadow-2xl">
                        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white p-1">
                            <X className="w-5 h-5" />
                        </button>
                        <NavContent />
                    </aside>
                </div>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
                    <div className="flex items-center gap-3 min-w-0">
                        <h2 className="text-sm font-semibold text-gray-800 capitalize truncate">
                            {navItems.find(n => n.path === location.pathname)?.label || 'ERP'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifs(!showNotifs)}
                                className={`p-2 rounded-full transition-colors relative ${alerts.length > 0 ? 'text-amber-500 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                <Bell className="w-5 h-5" />
                                {alerts.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white ring-2 ring-red-100 animate-pulse"></span>
                                )}
                            </button>

                            {showNotifs && (
                                <>
                                    <div className="fixed inset-0 z-40 lg:z-10 bg-black/5 lg:bg-transparent" onClick={() => setShowNotifs(false)}></div>
                                    <div className="fixed lg:absolute top-14 lg:top-auto right-4 left-4 lg:left-auto lg:mt-2 lg:w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 lg:z-20 py-0 overflow-hidden flex flex-col max-h-[70vh] lg:max-h-[400px]">
                                        <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                            <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Alertes Stock ({alerts.length})</span>
                                            <Link to="/alertes" onClick={() => setShowNotifs(false)} className="text-[11px] text-gray-500 hover:text-gray-900 font-bold underline decoration-gray-300">Gérer tout</Link>
                                        </div>
                                        <div className="overflow-y-auto last:border-b-0">
                                            {alerts.length === 0 ? (
                                                <div className="px-6 py-10 text-center text-gray-400 text-sm">
                                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-10" />
                                                    <p>Aucune alerte en cours.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-50">
                                                    {alerts.map(a => (
                                                        <Link key={a.id} to="/alertes" onClick={() => setShowNotifs(false)} className="block px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                                            <div className="flex justify-between items-start gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-900 truncate">{a.nom}</p>
                                                                    <p className="text-[10px] text-gray-500 truncate">{a.categorie_nom}</p>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className="text-xs font-black text-red-600 tabular-nums">{parseFloat(a.quantite_stock).toFixed(1)} kg</span>
                                                                    <p className="text-[9px] text-amber-600 font-medium">Seuil: {parseFloat(a.seuil_alerte_stock).toFixed(0)}</p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 border-l border-gray-100 pl-4">
                            <span className="font-medium text-gray-600">{user?.nom}</span>
                            <span className="text-gray-300">·</span>
                            <span className="capitalize">{user?.role}</span>
                        </div>
                    </div>
                </header>
                <main className={`flex-1 overflow-y-auto p-4 lg:p-8 ${mobileOpen ? 'overflow-hidden' : ''} pb-safe-nav lg:pb-8`}>
                    {children}
                </main>
            </div>

            {/* Navbar Mobile (Bottom) */}
            <nav className="bottom-nav pb-safe-nav lg:hidden">
                {user?.role && ['vendeur', 'stock', 'manager'].includes(user.role) && (
                    <Link to="/" className={`nav-tab ${location.pathname === '/' ? 'text-gray-900' : 'text-gray-400'}`}>
                        <LayoutDashboard className="w-5 h-5" /><span>Bord</span>
                    </Link>
                )}
                <Link to="/alertes" className={`nav-tab relative ${location.pathname === '/alertes' ? 'text-gray-900' : 'text-gray-400'}`}>
                    <Bell className="w-5 h-5" />
                    {alerts.length > 0 && <span className="absolute top-2 right-1/2 translate-x-3 w-2 h-2 bg-red-600 rounded-full border border-white"></span>}
                    <span>Alertes</span>
                </Link>
                {user?.role && ['vendeur', 'stock', 'manager'].includes(user.role) && (
                    <Link to="/catalogue" className={`nav-tab ${location.pathname === '/catalogue' ? 'text-gray-900' : 'text-gray-400'}`}>
                        <Package className="w-5 h-5" /><span>Stock</span>
                    </Link>
                )}
                {user?.role && ['vendeur', 'manager'].includes(user.role) && (
                    <Link to="/sorties" className={`nav-tab ${location.pathname === '/sorties' ? 'text-gray-900' : 'text-gray-400'}`}>
                        <ShoppingCart className="w-5 h-5" /><span>Ventes</span>
                    </Link>
                )}
                <button onClick={() => setMobileOpen(true)} className="nav-tab text-gray-400">
                    <Menu className="w-5 h-5" />
                    <span>Menu</span>
                </button>
            </nav>
        </div>
    );
};

export default Layout;
