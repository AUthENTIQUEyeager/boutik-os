# BoutiK Backend — API Node.js + Express + PostgreSQL

## Démarrage rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer l'environnement
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 3. Initialiser la base de données
```bash
npx prisma migrate dev --name init
npm run db:seed  # Optionnel : données de démo
```

### 4. Démarrer le serveur
```bash
npm run dev      # Développement (avec rechargement auto)
npm start        # Production
```

---

## Déploiement sur Render (gratuit)

### Étape 1 — Base de données PostgreSQL
1. render.com → **New PostgreSQL**
2. Name : `boutik-db`
3. Plan : **Free**
4. Copier l'**Internal Database URL**

### Étape 2 — Web Service Node.js
1. render.com → **New Web Service**
2. Connecter votre repo GitHub
3. Paramètres :
   - **Runtime** : Node
   - **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command** : `npm start`
4. Variables d'environnement :
   ```
   DATABASE_URL    = [URL copiée depuis PostgreSQL]
   JWT_SECRET      = [une clé secrète longue et aléatoire]
   FRONTEND_URL    = https://votre-app.vercel.app
   ADMIN_PASSWORD  = [mot de passe admin fort]
   NODE_ENV        = production
   ```
5. **Deploy**

Votre API sera accessible sur : `https://boutik-api.onrender.com`

---

## Connecter le frontend Vercel

Dans les variables d'environnement Vercel, ajouter :
```
VITE_API_URL = https://boutik-api.onrender.com
```

---

## Endpoints API

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Créer une boutique |
| POST | /api/auth/login | Connexion |
| GET | /api/auth/me | Profil boutique |
| GET | /api/boutique/stats | Stats dashboard |
| GET | /api/categories | Liste catégories |
| POST | /api/categories | Créer catégorie |
| GET | /api/produits | Liste produits |
| GET | /api/ventes | Historique ventes |
| POST | /api/ventes | Enregistrer vente |
| POST | /api/sync | Synchronisation offline |
| GET | /api/admin/boutiques | Admin : toutes boutiques |
| GET | /health | Santé du serveur |

---

## Architecture offline-first

```
Mobile (offline)          Serveur (online)
─────────────────         ─────────────────
Action utilisateur
→ IndexedDB locale   ──── /api/sync ──────→ PostgreSQL
← UI mise à jour     ←─── Confirmation ───
```

La synchronisation est **idempotente** : envoyer les mêmes données
plusieurs fois ne crée pas de doublons (upsert).
