import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, TrendingUp, Menu } from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/catalogue', label: 'Catalogue', icon: Package },
        { path: '/inventaire', label: 'Inventaire', icon: TrendingUp },
        { path: '/sorties', label: 'Vente', icon: ShoppingCart },
    ];

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 bg-white shadow-md z-10">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-green-600">Mini ERP</h1>
                    <p className="text-sm text-gray-500">Fruits & Légumes</p>
                </div>
                <nav className="mt-6">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors ${isActive ? 'bg-green-50 text-green-600 border-r-4 border-green-600' : ''
                                    }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Mobile Top Bar */}
            <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center z-10">
                <div>
                    <h1 className="text-xl font-bold text-green-600">Mini ERP</h1>
                    <p className="text-xs text-gray-500">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                    </p>
                </div>
                <div className="text-xs text-gray-400">
                    {new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto pb-20 md:pb-0">
                <header className="hidden md:flex bg-white shadow-sm p-4 justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <div className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>
                <main className="p-4 md:p-6">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-20 safe-area-bottom">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${isActive ? 'text-green-600' : 'text-gray-500'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                            <span className="text-xs mt-1 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default Layout;
