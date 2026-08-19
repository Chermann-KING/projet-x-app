# projet-x

Plateforme mobile de mise en relation entre clients et artisans vérifiés en Afrique francophone.  
Pilote au Gabon — 12 métiers couverts : plomberie, électricité, peinture, maçonnerie, menuiserie, carrelage, jardinage, climatisation, soudure, couverture, serrurerie, vitrerie.

---

## Problème

Le marché de l'artisanat en Afrique francophone souffre d'une opacité des prix, d'une absence de garantie qualité et d'une insécurité dans les transactions. **projet-x** répond à ce problème via une plateforme bilatérale avec confiance intégrée : profils vérifiés, devis formalisés, notation et portfolio.

---

## Trois espaces utilisateur

- **Client** — recherche d'artisans, demande de devis, chat, avis
- **Artisan** — onboarding avec vérification admin, gestion des devis, agenda, profil
- **Admin** — validation manuelle des profils, modération des signalements

---

## Stack

Expo 54 · React Native 0.81.5 · TypeScript strict · Supabase (Postgres, Auth, Storage, Edge Functions) · NativeWind · Expo Router · Zustand · TanStack Query · Reanimated 4 · i18next (fr, en, es, pt, ar, sw)

Tests : Jest (unitaire) · Playwright (e2e, web) · script de détection de collisions de routes (`npm run check:routes`)

---

## Architecture

Clean Architecture — 4 couches, dépendance toujours vers l'intérieur.

```
src/domain/          → Entités et interfaces (zéro framework)
src/application/     → Use cases (1 classe = 1 action métier)
src/infrastructure/  → Implémentations Supabase, notifications, storage
src/presentation/    → Composants React Native, hooks, stores
```

Routing file-based via Expo Router : `(auth)/` `(client)/` `(artisan)/` `(admin)/` `(legal)/`

---

## Modèle économique

Freemium artisan — Gratuit / Standard 5 000 FCFA/mois / Premium 12 000 FCFA/mois.  
Paiement Mobile Money (Airtel, Moov) prévu en V2.

---

Pour l'installation et la configuration, voir [SETUP.md](./SETUP.md).
