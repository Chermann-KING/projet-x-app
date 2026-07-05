# projet-x

Plateforme mobile de mise en relation entre clients et artisans vérifiés en Afrique francophone.  
Pilote au Gabon — 3 métiers couverts : plombier, électricien, peintre.

---

## Contexte

Le marché de l'artisanat en Afrique francophone souffre d'une opacité des prix, d'une absence de garantie qualité et d'une insécurité dans les transactions. **projet-x** répond à ce problème via une plateforme bilatérale avec confiance intégrée : profils vérifiés par un admin, devis formalisés, notation et portfolio.

**Modèle économique :** freemium artisan (Gratuit / Standard ~5 000 FCFA / Premium ~12 000 FCFA).  
Paiement Mobile Money prévu en V2.

**Trois espaces utilisateur :**
- **Client** — recherche, demande de devis, chat, avis
- **Artisan** — onboarding, gestion des demandes, agenda, profil
- **Admin** — validation des profils, modération des signalements

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework mobile | Expo SDK 54 / React Native 0.81.6 |
| Langage | TypeScript 5.9 (strict) |
| Navigation | Expo Router 5 (file-based) |
| Styling | NativeWind 4 / Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Edge Functions | Deno (Supabase) |
| State | Zustand + TanStack Query |
| Animations | Reanimated 3 |
| Icônes | Lucide React Native |
| Polices | Bricolage Grotesque (titres) · Nunito Sans (corps) |

---

## Architecture

Clean Architecture stricte — la dépendance va toujours vers l'intérieur.

```
src/
├── domain/           # Entités TypeScript + interfaces repositories (zéro dépendance framework)
├── application/      # Use cases (1 classe = 1 action métier, méthode execute())
├── infrastructure/   # Implémentations Supabase, Expo Notifications, Storage
├── presentation/     # Composants React Native, hooks, stores Zustand
├── shared/           # Design system, erreurs typées, AppLogger, utilitaires
└── di/               # container.ts — assemblage unique des dépendances
```

**Routing** : `app/` via Expo Router → `(auth)/` `(client)/` `(artisan)/` `(admin)/`

**Règles :**
- Aucun appel `supabase.from(...)` en dehors de `src/infrastructure/`
- Zéro `any` — TypeScript strict
- Zéro magic string visible — tout passe par `src/i18n/` (6 langues : fr, en, es, pt, ar, sw)
- Les erreurs sont typées et centralisées dans `src/shared/errors/`

---

## Prérequis

- Node.js 20+
- npm 10+
- Expo Go sur iOS ou Android (pour tester sans build natif)

---

## Installation

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd projet-x-app

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# → Renseigner les variables (voir section Variables d'environnement)

# 4. Démarrer
npx expo start
```

---

## Variables d'environnement

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase |
| `EXPO_PUBLIC_WHATSAPP_SUPPORT` | Numéro WhatsApp du support (ex. `32485891369`) |

Copier `.env.example` → `.env.local`. Ne jamais commiter `.env.local`.

---

## Edge Functions (Supabase)

Les Edge Functions se trouvent dans `../supabase/functions/` (racine du monorepo).

```bash
# Depuis la racine projet-x/ (pas projet-x-app/)

# Initialiser (une seule fois)
supabase login
supabase link --project-ref <project-ref>

# Déployer la fonction de notifications
supabase functions deploy create-notification --no-verify-jwt
```

La fonction `create-notification` gère l'insertion des notifications en base (service role, BYPASSRLS) et l'envoi des push Expo côté serveur.

---

## Build distribution (APK / IPA)

```bash
# Installer EAS CLI
npm install -g eas-cli
eas login

# Configurer (une seule fois)
eas build:configure

# Build APK Android pour testeurs
eas build --platform android --profile preview
```

---

## Structure des écrans

| Espace | Écrans |
|---|---|
| Auth | Splash · Choix du rôle · Connexion · Inscription · Mot de passe oublié |
| Client | Accueil + carte · Résultats · Profil artisan · Demande de devis · Mes demandes · Chat · Avis · Notifications · Profil |
| Artisan | Onboarding (3 étapes) · En attente de validation · Dashboard · Devis · Chat · Agenda · Profil · Abonnement |
| Admin | Validation artisans · Artisans actifs · Signalements |

---

## Conventions de commit

```
feat(scope): description courte
fix(scope): description courte
chore: description courte
```

Scopes utilisés : `domain` `application` `infrastructure` `presentation` `auth` `client` `artisan` `admin` `i18n` `di`
