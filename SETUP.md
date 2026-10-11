# Setup — projet-x

## Pré-requis

- Node.js 22.13+
- pnpm 12+ (via Corepack : `corepack enable`)
- Expo Go sur votre téléphone (iOS ou Android) pour tester

## Installation

```bash
# 1. Installer les dépendances
pnpm install

# 2. Copier les variables d'environnement
cp .env.example .env
# → Renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_KEY

# 3. Démarrer le projet
pnpm exec expo start
```

## Commandes disponibles

| Commande | Description |
|---|---|
| `pnpm start` | Lance le serveur Expo |
| `pnpm android` | Lance sur émulateur Android |
| `pnpm ios` | Lance sur simulateur iOS |
| `pnpm web` | Lance la version web |
| `pnpm lint` | Vérification ESLint |
| `pnpm type-check` | Vérification TypeScript |
| `pnpm format` | Formatage Prettier |
| `pnpm test` | Tests Jest |

## Structure du projet

```
app/                  # Routes Expo Router (file-based)
  (auth)/             # Splash, connexion, inscription
  (client)/           # Espace client (tab bar)
  (artisan)/          # Espace artisan (tab bar)
  (admin)/            # Panel admin (web uniquement)
src/
  domain/             # Entités + interfaces (couche 1)
  application/        # Use cases (couche 2)
  infrastructure/     # Implémentations Supabase (couche 3)
  presentation/       # Composants, hooks, stores (couche 4)
  shared/             # Errors, Logger, constants
  di/                 # Dependency Injection
```

## Règles fondamentales

1. **Supabase uniquement dans `src/infrastructure/`** — jamais dans les composants
2. **Icônes via Lucide uniquement** — `lucide-react-native` (mobile), `lucide-react` (web)
3. **Couleurs via `useTheme()`** — jamais de valeur hexadécimale codée en dur
4. **Erreurs/succès via `AppLogger`** — jamais d'`Alert.alert()` direct
5. **Avant d'implémenter un écran** → consulter `figma/screenshots/` correspondant

## Ressources de référence

| Ressource | Localisation |
|---|---|
| Palette couleurs | `for.css` |
| Screenshots écrans | `figma/screenshots/` |
| Architecture | `analyse-projet/phase-4-architecture.md` |
