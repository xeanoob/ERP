# Tutoriel d'Installation et de Démarrage - ERP Marche

Bienvenue sur le projet **ERP Marche**. Ce système est décomposé en deux parties : 
1. **Un Backend (API)** : développé avec Node.js, Express et PostgreSQL.
2. **Un Frontend (UI)** : développé avec React, Vite et Tailwind CSS.

Ce guide vous expliquera comment configurer et lancer le projet localement.

---

## 🛠 Prérequis

Avant de commencer, assurez-vous d'avoir installé les logiciels suivants sur votre machine :
- **Node.js** (v18 ou supérieur recommandé) - [Télécharger Node.js](https://nodejs.org/)
- **PostgreSQL** - [Télécharger PostgreSQL](https://www.postgresql.org/download/)
- **Git** (Optionnel, si vous utilisez un gestionnaire de versions)

---

## 🚀 1. Configuration de la Base de Données (PostgreSQL)

1. Ouvrez votre terminal PostgreSQL (ou un outil comme pgAdmin).
2. Vérifiez que les identifiants de l'utilisateur `postgres` correspondent à ceux dont vous disposez.
3. Exécutez le script SQL d'initialisation présent dans le backend :
   Il y a un fichier `database.sql` ou `init_db.js` dans le dossier `backend` qui vous aidera à initialiser les tables nécessaires pour le projet.

---

## ⚙️ 2. Lancement du Backend (API)

Le Backend gère la logique de l'application et la connexion à la base de données.

1. **Ouvrir un terminal** et naviguer vers le dossier `backend` :
   ```bash
   cd backend
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** :
   Vérifiez ou modifiez le fichier `.env` présent dans le dossier `backend`. Il doit contenir les informations suivantes (ajustez le mot de passe selon votre configuration PostgreSQL) :
   ```env
   PORT=5000
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=erpmarche
   DB_PASSWORD=VotreMotDePassePostgres
   DB_PORT=5432
   ```

4. **Démarrer le serveur** :
   Vous pouvez démarrer le serveur avec `nodemon` (pour le rechargement automatique) ou simplement via node :
   ```bash
   # Si nodemon n'est pas installé globalement, vous pouvez utiliser :
   npx nodemon server.js
   # ou
   node server.js
   ```
   Le backend devrait maintenant tourner sur l'adresse : `http://localhost:5000`

---

## 🎨 3. Lancement du Frontend (Interface Utilisateur)

Le Frontend est l'interface avec laquelle l'utilisateur interagit.

1. **Ouvrez un nouveau terminal** et naviguez vers le dossier `frontend` :
   ```bash
   cd frontend
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Démarrer le serveur de développement Vite** :
   ```bash
   npm run dev
   ```

4. **Accéder à l'application** :
   Une fois le serveur lancé, le terminal affichera une URL locale (généralement `http://localhost:5173`). Ouvrez ce lien dans votre navigateur.

---

## 📦 Résumé des Commandes Quotidiennes

Une fois la configuration initiale (npm install) et la base de données mises en place, voici comment lancer le projet au quotidien :

**Terminal 1 (Backend) :**
```bash
cd backend
npx nodemon server.js
```

**Terminal 2 (Frontend) :**
```bash
cd frontend
npm run dev
```

C'est tout ! L'ERP est maintenant prêt à être utilisé localement et vous pouvez l'enrichir de nouvelles fonctionnalités ! 🎉
