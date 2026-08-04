#!/usr/bin/env node
/**
 * Détecte les collisions de routes entre groupes Expo Router.
 *
 * Les segments de groupe ("(nom)") sont invisibles dans l'URL : un fichier
 * "(a)/x.tsx" et un fichier "(b)/x.tsx" résolvent tous les deux vers "/x".
 * Si deux groupes définissent le même chemin relatif, Expo Router doit
 * choisir arbitrairement lequel gagne — et ce choix peut différer entre le
 * serveur de dev Metro et un bundle preview/production.
 *
 * Sévérité :
 *  - CRITICAL : collision sur le index.tsx à la racine d'un groupe. Ce
 *    fichier correspond au chemin implicite "/", atteignable sans la moindre
 *    navigation explicite (cold start) — l'ambiguïté est donc réelle même si
 *    aucun code ne la déclenche jamais explicitement.
 *    Cas réel : (auth)/index.tsx vs (admin)/index.tsx, qui a bloqué
 *    l'app sur l'écran de démarrage en build preview (corrigé le 2026-08-03).
 *  - CRITICAL également : toute autre collision si le script trouve une
 *    référence non qualifiée par groupe (ex. '/profile' au lieu de
 *    '/(client)/profile') quelque part dans app/ ou src/.
 *  - WARNING : collision structurelle sans référence non qualifiée trouvée.
 *    Pas de bug tant que toute navigation vers ce chemin reste qualifiée par
 *    groupe — mais signalé pour rester vigilant si du code futur (deep link,
 *    router.push écrit vite) omet le préfixe.
 *
 * Usage : node scripts/check-route-collisions.js
 * Exit code 1 si au moins une collision CRITICAL, 0 sinon (warnings inclus).
 */
const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.join(__dirname, '..')
const APP_DIR = path.join(ROOT_DIR, 'app')
const SCAN_DIRS = [APP_DIR, path.join(ROOT_DIR, 'src')]
const ROUTE_FILE_RE = /\.(tsx|ts)$/
const GROUP_RE = /^\(.+\)$/

/** Liste récursivement les fichiers .ts/.tsx sous dir. skipPrefixed exclut les fichiers commençant par "_" ou "+" (layouts, routes spéciales Expo Router — pas de vraies routes concurrentes sur un chemin). */
function walkFiles(dir, base, { skipPrefixed } = {}) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipPrefixed && (entry.name.startsWith('_') || entry.name.startsWith('+'))) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkFiles(full, base, { skipPrefixed }))
    } else if (ROUTE_FILE_RE.test(entry.name)) {
      out.push(path.relative(base, full).split(path.sep).join('/'))
    }
  }
  return out
}

function findGroups() {
  return fs
    .readdirSync(APP_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && GROUP_RE.test(e.name))
    .map((e) => e.name)
}

/** "profile.tsx" -> "/profile" · "index.tsx" -> "" · "chat/[id].tsx" -> "/chat/[id]" · "quotes/index.tsx" -> "/quotes" */
function toRouteSegment(relPath) {
  const noExt = relPath.replace(ROUTE_FILE_RE, '')
  if (noExt === 'index') return ''
  if (noExt.endsWith('/index')) return '/' + noExt.slice(0, -'/index'.length)
  return '/' + noExt
}

function collectAllSources() {
  const files = []
  for (const dir of SCAN_DIRS) {
    for (const rel of walkFiles(dir, dir)) {
      files.push(path.join(dir, rel))
    }
  }
  return files.map((f) => ({
    file: path.relative(ROOT_DIR, f).split(path.sep).join('/'),
    text: fs.readFileSync(f, 'utf8'),
  }))
}

function findUnqualifiedReferences(routeSegment, sources) {
  const escaped = routeSegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`['"\`]${escaped}(['"\`/])`, 'g')
  const hits = []
  for (const { file, text } of sources) {
    if (re.test(text)) hits.push(file)
    re.lastIndex = 0
  }
  return hits
}

function main() {
  const groups = findGroups()
  const byRelPath = new Map()

  for (const group of groups) {
    const groupDir = path.join(APP_DIR, group)
    for (const relPath of walkFiles(groupDir, groupDir, { skipPrefixed: true })) {
      if (!byRelPath.has(relPath)) byRelPath.set(relPath, [])
      byRelPath.get(relPath).push(group)
    }
  }

  const collisions = [...byRelPath.entries()].filter(([, gs]) => gs.length > 1)

  if (collisions.length === 0) {
    console.log('✓ Aucune collision de route entre groupes.')
    process.exit(0)
  }

  const sources = collectAllSources()
  const report = []

  for (const [relPath, groupList] of collisions) {
    const isRootIndex = relPath === 'index.tsx' || relPath === 'index.ts'
    const routeSegment = toRouteSegment(relPath)

    if (isRootIndex) {
      report.push({
        severity: 'CRITICAL',
        relPath,
        message:
          `"${relPath}" à la racine de plusieurs groupes (${groupList.join(', ')}) ` +
          `→ tous résolvent vers le chemin implicite "/", atteignable sans navigation ` +
          `explicite (cold start). Un seul groupe peut posséder un index.tsx racine, ` +
          `ou mieux : un app/index.tsx unique hors groupe qui redirige ensuite.`,
      })
      continue
    }

    const refs = findUnqualifiedReferences(routeSegment, sources)
    if (refs.length > 0) {
      report.push({
        severity: 'CRITICAL',
        relPath,
        message:
          `"${relPath}" en collision entre ${groupList.join(', ')} (→ "${routeSegment}") ` +
          `ET référencé sans préfixe de groupe dans : ${refs.join(', ')}. ` +
          `Qualifiez ces hrefs/router.push avec /(groupe)${routeSegment}.`,
      })
    } else {
      report.push({
        severity: 'WARNING',
        relPath,
        message:
          `"${relPath}" en collision entre ${groupList.join(', ')} (→ "${routeSegment}"). ` +
          `Aucune référence non qualifiée trouvée actuellement — reste sûr tant que toute ` +
          `navigation vers ce chemin utilise /(groupe)${routeSegment} explicitement.`,
      })
    }
  }

  const criticals = report.filter((r) => r.severity === 'CRITICAL')
  const warnings = report.filter((r) => r.severity === 'WARNING')

  for (const r of report) {
    console.log(`\n[${r.severity}] ${r.relPath}`)
    console.log(`  ${r.message}`)
  }

  console.log(
    `\n${report.length} collision(s) — ${criticals.length} critique(s), ${warnings.length} avertissement(s).`,
  )

  if (criticals.length > 0) {
    console.log('\n✗ Échec : collision(s) critique(s). Voir CLAUDE.md § Routing multi-groupes.')
    process.exit(1)
  }

  console.log('\n✓ Pas de collision critique (avertissements non bloquants).')
  process.exit(0)
}

main()
