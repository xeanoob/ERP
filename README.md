# Stocko — Gestion de Marché

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
- **Catalogue Produits** — CRUD dynamique avec édition complète en ligne (Nom, Origine, Unité, Taxes, Prix)
- **Gestion Unifiée** — Configuration centralisée des Catégories, Taxes (avec option par défaut), Lieux de Vente et Charges Fixes
- **Intégration Balance (API)** — Génération de clés Webhook (`api_keys`) pour synchronisation automatique des balances connectées (ex: balance EOS)
- **Dashboard Dynamique** — CA/coût/marge avec déduction dynamique des charges fixes selon la période choisie (7j, 30j, annuel...)
- **Inventaire Simplifié** — Mode liste épuré avec gestion des alertes d'approvisionnement et filtres par catégorie
- **Ventes & Historique** — Saisie des ventes avec Lieux de vente et déduction FIFO automatique
- **Exports** — Exportation un-clic en PDF et CSV du catalogue complet, inventaire ou historique
- **Mobile-First** — Interface réactive, adaptée aux smartphones et tablettes

## Schéma BDD (noms singulier)

```
utilisateur
fournisseur ──┐
              ├── stock ──── sortie ──── lieu_vente
produit ──────┘
  │      │
categorie  taxe

charge_fixe
api_keys
```

| Table | Colonnes principales |
|-------|---------------------|
| `produit` | nom, categorie_id, taxe_id, **origine**, **unite**, quantite_stock, prix_actif, seuil_alerte_stock |
| `categorie` | nom, actif |
| `taxe` | nom, taux, **is_default**, actif |
| `stock` | produit_id, fournisseur_id, quantite_achetee, prix_achat_unitaire |
| `sortie` | stock_id, **lieu_vente_id**, quantite_sortie, prix_reel |
| `fournisseur` | nom, contact, email, telephone, adresse |
| `utilisateur` | nom, email, mot_de_passe, role |
| `lieu_vente`| nom, actif |
| `charge_fixe`| nom, montant, periode, actif |
| `api_keys` | service_name, api_key, actif |

> **Règle MCD** : aucune donnée calculée n'est stockée. Marges, couts des charges directes et KPI de périodes sont calculés à la volée.

## Installation

### 1. Backend
- Configurer le `.env`
- `node init_db.js`
- `npm run dev`

### 2. Frontend
- `npm install`
- `npm run dev`

Identifiants par défaut : `admin@erp.local` / `admin123`
