import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/catalogue" element={<Catalogue />} />

              {/* Routes Stock / Manager */}
              <Route path="/inventaire" element={
                <ProtectedRoute roles={['stock', 'manager']}><Inventaire /></ProtectedRoute>
              } />
              <Route path="/fournisseurs" element={
                <ProtectedRoute roles={['stock', 'manager']}><Fournisseurs /></ProtectedRoute>
              } />
              <Route path="/alertes" element={
                <ProtectedRoute roles={['stock', 'manager']}><Alertes /></ProtectedRoute>
              } />

              {/* Routes Vendeur / Manager */}
              <Route path="/sorties" element={
                <ProtectedRoute roles={['vendeur', 'manager']}><Sorties /></ProtectedRoute>
              } />
              <Route path="/historique" element={
                <ProtectedRoute roles={['vendeur', 'manager']}><Historique /></ProtectedRoute>
              } />

              {/* Routes Manager Only */}
              <Route path="/utilisateurs" element={
                <ProtectedRoute roles={['manager']}><Utilisateurs /></ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
