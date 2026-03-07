import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Truck, Users, LogOut, Bell, Settings, Clock, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const allNavItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['vendeur', 'stock', 'manager'] },
        { path: '/catalogue', label: 'Catalogue', icon: Package, roles: ['vendeur', 'stock', 'manager'] },
        { path: '/inventaire', label: 'Inventaire', icon: TrendingUp, roles: ['stock', 'manager'] },
        { path: '/sorties', label: 'Ventes', icon: ShoppingCart, roles: ['vendeur', 'manager'] },
        { path: '/historique', label: 'Historique', icon: Clock, roles: ['vendeur', 'manager'] },
        { path: '/fournisseurs', label: 'Fournisseurs', icon: Truck, roles: ['stock', 'manager'] },
        { path: '/alertes', label: 'Alertes', icon: Bell, roles: ['stock', 'manager'] },
        { path: '/utilisateurs', label: 'Utilisateurs', icon: Settings, roles: ['manager'] },
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
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-gray-800 capitalize">
                            {navItems.find(n => n.path === location.pathname)?.label || 'ERP'}
                        </h2>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                        <span>{user?.nom}</span>
                        <span className="text-gray-300">·</span>
                        <span className="capitalize">{user?.role}</span>
                    </div>
                </header>
                <main className={`flex-1 overflow-y-auto p-4 lg:p-8 ${mobileOpen ? 'overflow-hidden' : ''} pb-safe-nav lg:pb-8`}>
                    {children}
                </main>
            </div>

            {/* Navbar Mobile (Bottom) */}
            <nav className="bottom-nav pb-safe-nav">
                {user?.role && ['vendeur', 'stock', 'manager'].includes(user.role) && (
                    <Link to="/" className={`nav-tab ${location.pathname === '/' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                        <LayoutDashboard className="w-5 h-5" /><span>Bord</span>
                    </Link>
                )}
                {user?.role && ['vendeur', 'stock', 'manager'].includes(user.role) && (
                    <Link to="/catalogue" className={`nav-tab ${location.pathname === '/catalogue' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Package className="w-5 h-5" /><span>Stock</span>
                    </Link>
                )}
                {user?.role && ['vendeur', 'manager'].includes(user.role) && (
                    <Link to="/sorties" className={`nav-tab ${location.pathname === '/sorties' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                        <ShoppingCart className="w-5 h-5" /><span>Ventes</span>
                    </Link>
                )}
                {user?.role && ['stock', 'manager'].includes(user.role) && (
                    <Link to="/fournisseurs" className={`nav-tab ${location.pathname === '/fournisseurs' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Truck className="w-5 h-5" /><span>Lots</span>
                    </Link>
                )}
                {user?.role === 'manager' && (
                    <Link to="/utilisateurs" className={`nav-tab ${location.pathname === '/utilisateurs' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Users className="w-5 h-5" /><span>Équipe</span>
                    </Link>
                )}
                {user?.role === 'manager' && (
                    <Link to="/configuration" className={`nav-tab ${location.pathname === '/configuration' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                        <Settings className="w-5 h-5" /><span>Config</span>
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
