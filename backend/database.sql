CREATE TABLE IF NOT EXISTS produits (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    categorie VARCHAR(100) NOT NULL,
    variete VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS lots (
    id SERIAL PRIMARY KEY,
    produit_id INTEGER REFERENCES produits(id),
    quantite_initiale DECIMAL(10, 2) NOT NULL,
    quantite_restante DECIMAL(10, 2) NOT NULL,
    prix_achat_unitaire DECIMAL(10, 2) NOT NULL,
    date_entree TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sorties (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id),
    quantite_sortie DECIMAL(10, 2) NOT NULL,
    prix_vente_unitaire DECIMAL(10, 2) NOT NULL,
    date_sortie TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
