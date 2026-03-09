# Mini ERP — Gestion de Marché

Application de gestion commerciale pour marché de produits frais. Suivi des stocks (FIFO), gestion fournisseurs, alertes de seuil, et tableau de bord financier. Interface mobile-first.

---

## Structure du Projet

### Backend (`/backend`)
- **`server.js`** : Point d'entrée de l'API. Configure Express et les routes.
- **`db.js`** : Configuration du pool de connexion PostgreSQL.
- **`init_db.js`** : Script pour initialiser la base de données (tables et données de test).
- **`routes/`** : Logique métier par entité (ventes, produits, utilisateurs, etc.).
  - **`sales.js`** : Gère les ventes avec déduction FIFO automatique.
- **`middleware/auth.js`** : Vérification des tokens JWT et des rôles.

### Frontend (`/frontend`)
- **`src/main.jsx`** : Point d'entrée React.
- **`src/App.jsx`** : Configuration du routage et du layout.
- **`src/pages/`** : Composants de pages principaux.
  - **`Inventaire.jsx`** : Vue d'ensemble des stocks et gestion des seuils d'alerte.
  - **`Catalogue.jsx`** : Gestion brute des produits (CRUD).
  - **`Sorties.jsx`** : Interface de saisie des ventes (déclenche la logique FIFO).
- **`src/components/`** : Composants UI réutilisables (Layout, Navbar, etc.).

## Logique FIFO (First In, First Out)

L'inventaire est géré par lots dans la table `stock`. Lorsqu'une vente est effectuée :
1. L'application cherche les lots disponibles pour le produit.
2. Elle consomme en priorité les lots les plus anciens (triés par `created_at`).
3. Elle crée des enregistrements dans la table `sortie` liés à chaque lot impacté.
4. Le stock global du produit est mis à jour.

---

## Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Chart.js, Lucide Icons |
| **Backend** | Node.js, Express, PostgreSQL |
| **Auth** | JWT (jsonwebtoken), bcryptjs |

## Fonctionnalités

- **Authentification** — Login JWT avec rôles (vendeur, stock, manager)
- **Gestion Utilisateurs** — Création de comptes, changement de rôles, activation/désactivation (manager only)
- **Catalogue Produits** — CRUD, recherche, pagination, prix actif, seuil d'alerte, taxes
- **Configuration Unifiée** — Gestion des catégories et des taxes dans un seul espace
- **Inventaire** — Entrées de stock liées aux fournisseurs, édition des seuils inline
- **Ventes** — Déduction FIFO automatique, prix réel
- **Historique des Ventes** — Filtres par date et produit, KPI en temps réel
- **Fournisseurs** — Carnet d'adresses fournisseurs avec recherche
- **Alertes d'Approvisionnement** — Page dédiée avec statuts OK/BAS/CRITIQUE
- **Dashboard** — CA/coût/marge (jour + mois), compteurs, alertes stock bas
- **Mobile-First** — Menu burger, cards sur mobile, tables sur desktop

## Schéma BDD (noms singulier)

```
utilisateur
fournisseur ──┐
              ├── stock ──── sortie
produit ──────┘
  │      │
categorie  taxe
```

| Table | Colonnes principales |
|-------|---------------------|
| `produit` | nom, categorie_id, taxe_id, variete, **quantite_stock**, **prix_actif**, seuil_alerte_stock |
| `categorie` | nom, actif |
| `taxe` | nom, taux, actif |
| `stock` | produit_id, fournisseur_id, **quantite_achetee**, prix_achat_unitaire |
| `sortie` | stock_id, quantite_sortie, **prix_reel** |
| `fournisseur` | nom, contact, email, telephone, adresse |
| `utilisateur` | nom, email, mot_de_passe, role |

> **Règle MCD** : aucune donnée calculée n'est stockée. Marges et moyennes sont calculées à la volée.

## Installation

### 1. Backend
- Configurer le `.env`
- `node init_db.js`
- `npm run dev`

### 2. Frontend
- `npm install`
- `npm run dev`

Identifiants par défaut : `admin@erp.local` / `admin123`
