# BoutiK v2 — Gestion commerciale pour commerçants ouest-africains

Monorepo complet : backend Node/Express/Prisma + frontend React PWA.

## Structure

```
boutik-os/
├── backend/     → API Express + Prisma + PostgreSQL
└── frontend/    → React 18 + Vite 5.4.21 + Tailwind, PWA offline-first
```

## Stack & versions figées (pour éviter les surprises au déploiement)

- Node 20.x
- Vite **5.4.21** exact (pas de `^`, car Vite 6+ utilise rolldown, instable sur Vercel)
- React 18.3.1
- Express 4.19.2 + Prisma 5.20.0
- PostgreSQL (Render, Supabase ou Neon — au choix)

## Variables d'environnement (minimum absolu)

### Backend (4 variables)
```
DATABASE_URL=postgresql://...
JWT_SECRET=une-longue-chaine-aleatoire
ADMIN_PASSWORD=mot-de-passe-admin
FRONTEND_URL=https://ton-app.vercel.app
```

### Frontend (1 variable)
```
VITE_API_URL=https://ton-backend.onrender.com
```

Aucun autre service tiers requis : pas de S3 (le logo est stocké en base64 dans PostgreSQL), pas de Redis, pas de queue externe.

## Déploiement

### 1. Base de données
Crée une base PostgreSQL gratuite sur [Render](https://render.com), [Supabase](https://supabase.com) ou [Neon](https://neon.tech). Récupère l'URL de connexion → `DATABASE_URL`.

### 2. Backend sur Render
- New Web Service → connecte ton repo GitHub → dossier racine `backend/`
- Build command : `npm install && npx prisma generate && npx prisma migrate deploy`
- Start command : `npm start`
- Ajoute les 4 variables d'environnement ci-dessus
- Note l'URL générée (ex. `https://boutik-backend.onrender.com`)

Pour la toute première migration en local avant de pousser :
```bash
cd backend
cp .env.example .env   # renseigne DATABASE_URL
npm install
npx prisma migrate dev --name init
```

### 3. Frontend sur Vercel
- New Project → connecte ton repo → dossier racine `frontend/`
- Build command : `node node_modules/vite/bin/vite.js build`
- Output directory : `dist`
- Ajoute `VITE_API_URL` = URL de ton backend Render
- Le fichier `vercel.json` gère déjà le routing SPA

### 4. Mets à jour `FRONTEND_URL` sur Render
Une fois le frontend déployé, retourne sur Render et mets `FRONTEND_URL` à jour avec l'URL Vercel réelle (pour CORS).

## Développement local

```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev          # http://localhost:4000

# Frontend (autre terminal)
cd frontend
cp .env.example .env  # VITE_API_URL=http://localhost:4000
npm install
npm run dev           # http://localhost:5173
```

## Accès admin

Va sur `/admin/login` avec le mot de passe défini dans `ADMIN_PASSWORD`. Le token admin est stocké séparément (`boutik_admin_token`) et n'affecte jamais la session boutique en cours.

## Ce qui est fait

- **Backend complet** : auth (register/login/JWT 30j), boutique, catégories + produits individuels (IDs type `RMA-0001`), ventes (normale + rapide), clients, salariés, commandes fournisseurs avec réception de stock, dépenses, dettes clients + paiements partiels, sync push/pull différentiel, tracking PWA, admin (blocage/déblocage, stats globales), import CSV produits/clients.
- **Frontend complet** : design system (Button/Card/Input/Badge/StatCard/EmptyState/Modal...), layout responsive 3 breakpoints (bottom nav mobile / sidebar compacte tablette / sidebar complète desktop), toutes les pages listées dans la spec, PWA (manifest, service worker, bannière d'installation Android + instructions iOS, anti-spam 3 visites), reçus imprimables, IndexedDB avec isolation par compte, sync bidirectionnelle toutes les 5s.
- **Build validé** : `npx vite build` passe sans erreur ni avertissement ; tous les fichiers backend passent la vérification syntaxique Node.

## Ce qu'il reste à faire toi-même

- `npx prisma migrate dev` en local (nécessite un accès réseau à `binaries.prisma.sh`, indisponible dans l'environnement où ce code a été généré)
- Remplacer les icônes PWA (`frontend/public/pwa-*.png`) par ton propre logo si tu veux — celles fournies sont des placeholders verts avec un "B"
- Tester le flux complet une fois déployé (inscription → vente → sync multi-appareils)
- Le graphique 30 jours dans Stats affiche seulement le tableau top catégories ; le graphique en barres SVG couvre les 7 derniers jours (comme spécifié)
