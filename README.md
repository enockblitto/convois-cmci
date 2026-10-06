# CMCI Convois — gestion des convois pour les croisades

Application web de la **Communauté Missionnaire Chrétienne Internationale — Côte d’Ivoire** pour organiser les déplacements des fidèles vers les croisades : croisades, convois, véhicules, conducteurs, responsables, réservations, paiements et reçus.

- **Front-end** : React 18 + Vite, Tailwind CSS, Framer Motion (animations), React Router
- **Back-end** : Supabase (PostgreSQL, Auth, RLS, fonctions RPC)
- **Coût** : 0 FCFA (Supabase Free + hébergement statique gratuit Netlify / Vercel / Cloudflare Pages)

## Démarrage

```bash
npm install
npm run dev
```

Sans fichier `.env`, l’application démarre en **mode démo** : les données sont stockées dans le navigateur (localStorage) et trois comptes sont disponibles :

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@cmci.ci | admin123 |
| Participant | fidele@cmci.ci | demo123 |

## Brancher Supabase

1. Créer un projet gratuit sur https://supabase.com.
2. Dans **SQL Editor**, exécuter `supabase/schema.sql`.
3. Copier `.env.example` en `.env` et renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Project Settings > API).
4. S’inscrire dans l’application, puis promouvoir son compte : `update public.profiles set role = 'admin' where email = '...';`

## Architecture (monolithe modulaire en couches)

```
src/
  app/            Point d’entrée, routeur, providers
  core/           Configuration, client Supabase, constantes, formatage
  data/           Couche d’accès aux données
    repository.js   CRUD générique (Supabase ou mode démo, même interface)
    operations.js   Opérations métier critiques (RPC serveur / équivalent démo)
    demoStore.js    Base locale du mode démo + seed.js
  modules/        Un dossier par domaine métier
    <module>/xxxService.js   Règles métier + jointures
    <module>/*Page.jsx       Présentation
    auth, intro, accueil, croisades, convois, vehicules, conducteurs,
    reservations, paiements, dashboard, utilisateurs, admin
  shared/         UI réutilisable, layouts, animations
supabase/schema.sql  Tables, contraintes, fonctions métier, RLS
```

Flux : **Page → Service (règles) → Repository / Operations → Supabase**.

## Règles métier clés

- Réservation via la fonction `reserver_place` (verrou `FOR UPDATE`) : pas de surréservation, pas de doublon (index unique partiel), passage automatique en *complet*.
- Annulation : libère les places et rouvre le convoi ; une réservation payée ne peut être annulée que par un administrateur.
- Paiement : le participant déclare (Mobile Money avec référence, ou espèces) → l’administrateur valide → la réservation est confirmée et un **reçu numéroté avec QR code** est généré (imprimable / PDF).
- Rôles : **admin** (gestion des convois, réservations et paiements), **participant** (ses réservations).
- Mise à jour d’une base existante : exécuter `supabase/migrations/202610060001_remove_responsable_role.sql` dans le SQL Editor. Les anciens comptes responsables deviennent administrateurs.

## Animations

Introduction animée du logo au premier chargement de l’accueil (anneaux tracés, révélation floue, reflet, titre lettre par lettre, puis transition du logo vers la barre de navigation), parallaxe, compteurs animés, apparitions au défilement, transitions de pages. `prefers-reduced-motion` est respecté et l’intro peut être passée.

## Déploiement gratuit

`npm run build` puis publier `dist/` (Netlify : `public/_redirects` inclus ; Vercel : `vercel.json` inclus). Ajouter les variables `VITE_SUPABASE_*` dans l’hébergeur.
