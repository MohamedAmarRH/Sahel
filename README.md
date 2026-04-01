# 🥛 Yaourt du Sahel - Backend API

Backend Node.js + Express + Supabase PostgreSQL pour le site Yaourt du Sahel.

## 📋 Prérequis

- Node.js 18+ installé
- Un compte [Supabase](https://supabase.com) (gratuit)

## 🚀 Déploiement Rapide

### Étape 1: Créer la base de données Supabase

1. Créez un compte sur [https://supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **SQL Editor** (Éditeur SQL)
4. Copiez-collez le contenu du fichier `database.sql`
5. Exécutez le script

### Étape 2: Récupérer les credentials

1. Dans Supabase, allez dans **Project Settings** > **API**
2. Copiez :
   - `URL` (SUPABASE_URL)
   - `anon public` (SUPABASE_ANON_KEY)

### Étape 3: Configurer le backend

```bash
# 1. Copier le fichier d'environnement
cp .env.example .env

# 2. Éditer .env avec vos credentials
nano .env
```

Remplacez :
```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-anon-public
```

### Étape 4: Installer et démarrer

```bash
# Installer les dépendances
npm install

# Démarrer en production
npm start

# OU démarrer en développement (avec auto-reload)
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 📡 API Endpoints

### Commandes (Orders)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/orders` | Liste toutes les commandes |
| GET | `/api/orders/:id` | Détails d'une commande |
| POST | `/api/orders` | Créer une nouvelle commande |
| PUT | `/api/orders/:id/status` | Mettre à jour le statut |
| DELETE | `/api/orders/:id` | Supprimer une commande |

**Body pour POST /api/orders:**
```json
{
  "nom": "Amadou Issa",
  "telephone": "+227 90 12 34 56",
  "type_evenement": "mariage",
  "date_evenement": "2024-12-25",
  "quantite": "50 sachets de yaourt, 30 sachets de toukoudi",
  "adresse": "Zinder, quartier XXX",
  "message": "Livraison pour 14h"
}
```

### Avis (Reviews)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reviews` | Liste tous les avis + stats |
| POST | `/api/reviews` | Créer un nouvel avis |
| PUT | `/api/reviews/:id/like` | Liker un avis |
| DELETE | `/api/reviews/:id` | Supprimer un avis |

**Body pour POST /api/reviews:**
```json
{
  "name": "Amadou I.",
  "rating": 5,
  "comment": "Excellent yaourt !"
}
```

### Contact

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/contact` | Envoyer un message |

### Statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats` | Stats dashboard |
| GET | `/api/health` | Vérification API |

## 🌐 Déploiement en Production

### Option 1: Railway (Recommandé - Gratuit)

1. Créez un compte sur [Railway](https://railway.app)
2. Créez un nouveau projet
3. Connectez votre repo GitHub ou uploadez les fichiers
4. Ajoutez les variables d'environnement
5. Déployez !

### Option 2: Render (Gratuit)

1. Créez un compte sur [Render](https://render.com)
2. New Web Service
3. Connectez votre repo
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Ajoutez les variables d'environnement

### Option 3: Heroku

```bash
# Installer Heroku CLI
heroku login
heroku create yaourt-du-sahel-api

# Définir les variables d'environnement
heroku config:set SUPABASE_URL=votre-url
heroku config:set SUPABASE_ANON_KEY=votre-cle

# Déployer
git push heroku main
```

## 🔧 Configuration Frontend

Une fois le backend déployé, mettez à jour le frontend avec l'URL de l'API :

```javascript
// Dans le frontend
const API_URL = 'https://votre-backend-deploye.com';
```

## 📊 Structure de la Base de Données

### Table `orders`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | ID unique |
| nom | VARCHAR | Nom du client |
| telephone | VARCHAR | Numéro de téléphone |
| type_evenement | VARCHAR | Type d'événement |
| date_evenement | DATE | Date de l'événement |
| quantite | TEXT | Quantité commandée |
| adresse | TEXT | Adresse de livraison |
| message | TEXT | Message optionnel |
| produits | JSONB | Liste des produits |
| status | VARCHAR | pending/confirmed/delivered/cancelled |
| created_at | TIMESTAMP | Date de création |

### Table `reviews`
| Champ | Type | Description |
|-------|------|-------------|
| id | UUID | ID unique |
| name | VARCHAR | Nom du client |
| rating | INTEGER | Note 1-5 |
| comment | TEXT | Commentaire |
| likes | INTEGER | Nombre de likes |
| created_at | TIMESTAMP | Date de création |

## 🔒 Sécurité

- Rate limiting: 100 requêtes / 15 minutes par IP
- CORS configuré pour le frontend
- Helmet pour les headers de sécurité
- Row Level Security (RLS) activé sur Supabase

## 🆘 Support

En cas de problème :
1. Vérifiez les logs: `npm start`
2. Testez l'API: `curl http://localhost:3000/api/health`
3. Vérifiez vos credentials Supabase

## 📄 License

MIT
