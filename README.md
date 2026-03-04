# Mini ERP — Gestion de Marché

Application de gestion commerciale pour marché de produits frais. Suivi des stocks (FIFO), gestion fournisseurs, alertes de seuil, et tableau de bord financier. Interface mobile-first.

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
- **Catalogue Produits** — CRUD, recherche, pagination, prix actif, seuil d'alerte
- **Catégories Dynamiques** — Ajout/suppression de catégories à la volée
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
  │
categorie
```

| Table | Colonnes principales |
|-------|---------------------|
| `produit` | nom, categorie_id, variete, **quantite_stock**, **prix_actif**, seuil_alerte_stock |
| `categorie` | nom, actif |
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
