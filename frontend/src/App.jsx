import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Catalogue from './pages/Catalogue';
import Inventaire from './pages/Inventaire';
import Sorties from './pages/Sorties';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/inventaire" element={<Inventaire />} />
          <Route path="/sorties" element={<Sorties />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
