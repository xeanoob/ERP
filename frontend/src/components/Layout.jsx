import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, TrendingUp } from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/catalogue', label: 'Catalogue', icon: Package },
        { path: '/inventaire', label: 'Inventaire', icon: TrendingUp },
        { path: '/sorties', label: 'Ventes', icon: ShoppingCart },
    ];

    return (
        <div className="flex h-screen bg-[#F9FAFB] font-sans selection:bg-gray-200">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-[#0A0A0A] border-r border-gray-800 z-10 text-gray-300 shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-gray-800/60">
                    <h1 className="text-sm font-semibold text-white tracking-tight uppercase">Mini ERP</h1>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${isActive
                                        ? 'bg-gray-800 text-white font-medium'
                                        : 'hover:bg-gray-800/50 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 md:px-8 shrink-0 relative z-10">
                    <h2 className="text-sm font-semibold text-gray-900">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Overview'}
                    </h2>
                    <div className="text-xs font-medium text-gray-500">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex py-2 px-1 z-20 pb-safe">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md ${isActive ? 'text-gray-900' : 'text-gray-400'
                                }`}
                        >
                            <Icon className="w-5 h-5 mb-1" />
                            <span className="text-[10px] uppercase font-semibold tracking-wider">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default Layout;
