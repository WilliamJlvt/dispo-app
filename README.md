# Créneaux

> Planification collaborative par disponibilités — chacun coche ses créneaux libres, la heatmap révèle les meilleurs moments en temps réel.

---

## C'est quoi ?

Créneaux c'est un outil interne pour trouver un horaire qui convient à tout le monde, sans les allers-retours interminables sur Slack.

- Tu crées un créneau (plage de dates + fenêtre horaire)
- Tu partages le lien
- Chacun coche ses disponibilités
- La heatmap verte montre instantanément les meilleurs moments
- Le lien Discord/Slack génère une preview avec le meilleur créneau

Pas de compte à créer, pas de base de données — juste Google OAuth pour s'authentifier et des fichiers YAML pour stocker les données.

---

## Stack

|                 |                                        |
| --------------- | -------------------------------------- |
| **Framework**   | SvelteKit (Svelte 5 runes)             |
| **Runtime**     | Bun                                    |
| **Auth**        | Google OAuth2 via Arctic, sessions JWT |
| **Storage**     | Fichiers YAML (pas de DB)              |
| **Styles**      | Tailwind CSS v4                        |
| **Temps réel**  | Server-Sent Events                     |
| **OG images**   | Satori + resvg                         |
| **Déploiement** | Docker + Traefik                       |

---

## Lancer en local

**1. Cloner et installer**

```bash
git clone ...
cd crenaux
bun install
```

**2. Créer un `.env`**

```bash
cp .env.example .env
```

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
SESSION_SECRET=une-chaine-dau-moins-32-caracteres!!
ORIGIN=http://localhost:5173
DATA_DIR=./data
```

**3. Configurer Google OAuth**

Dans la [Google Cloud Console](https://console.cloud.google.com/) :

- Créer un projet → API & Services → Identifiants → OAuth 2.0
- Ajouter `http://localhost:5173/auth/callback` dans les URIs de redirection autorisés
- Activer l'API **Google Calendar** si tu veux la fonctionnalité agenda

**4. Démarrer**

```bash
bun dev
```

---

## Configuration

Tout se gère dans `data/config.yaml` (créé automatiquement au premier lancement) ou via la page `/admin` :

```yaml
allowed_emails:
  - alice@exemple.com
  - '*@monentreprise.com' # wildcard domaine entier

admin_emails:
  - alice@exemple.com # accès à la page /admin
```

---

## Déploiement

**Docker Compose** (derrière Traefik) :

```bash
cp .env.example .env
# remplir les variables, notamment DOMAIN et ORIGIN

docker compose up -d
```

Le dossier `./data` est monté en volume — les données survivent aux mises à jour.

**Build manuel** :

```bash
bun run build
bun start          # écoute sur le port 3000
```

---

## Structure des données

Chaque créneau = un fichier YAML dans `data/crenaux/` :

```yaml
id: 2024-01-15-sprint-planning-x4z2
title: Sprint Planning
created_by: alice@exemple.com
date_start: '2024-01-22'
date_end: '2024-01-26'
hour_start: 10
hour_end: 18
include_weekends: false
responses:
  alice@exemple.com:
    name: Alice
    updated_at: '2024-01-15T10:00:00Z'
    slots:
      '2024-01-22': [10, 11, 14]
      '2024-01-23': [10, 11]
```

---

## Commandes utiles

```bash
bun dev          # dev avec HMR
bun run build    # build production
bun run lint     # vérifier le code
bun run lint:fix # formatter + corriger
```
