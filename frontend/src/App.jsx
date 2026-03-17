import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Catalogue from './pages/Catalogue';
import Inventaire from './pages/Inventaire';
import Sorties from './pages/Sorties';
import Fournisseurs from './pages/Fournisseurs';
import Alertes from './pages/Alertes';
import Utilisateurs from './pages/Utilisateurs';
import Historique from './pages/Historique';
import Configuration from './pages/Configuration';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-sm text-gray-500">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen text-sm text-gray-500">Chargement...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      {}
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/catalogue" element={<ProtectedRoute><Layout><Catalogue /></Layout></ProtectedRoute>} />
      <Route path="/inventaire" element={<ProtectedRoute roles={['stock', 'manager']}><Layout><Inventaire /></Layout></ProtectedRoute>} />
      <Route path="/fournisseurs" element={<ProtectedRoute roles={['stock', 'manager']}><Layout><Fournisseurs /></Layout></ProtectedRoute>} />
      <Route path="/alertes" element={<ProtectedRoute roles={['stock', 'manager']}><Layout><Alertes /></Layout></ProtectedRoute>} />
      <Route path="/sorties" element={<ProtectedRoute roles={['vendeur', 'manager']}><Layout><Sorties /></Layout></ProtectedRoute>} />
      <Route path="/historique" element={<ProtectedRoute roles={['vendeur', 'manager']}><Layout><Historique /></Layout></ProtectedRoute>} />
      <Route path="/utilisateurs" element={<ProtectedRoute roles={['manager']}><Layout><Utilisateurs /></Layout></ProtectedRoute>} />
      <Route path="/configuration" element={<ProtectedRoute roles={['manager']}><Layout><Configuration /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
