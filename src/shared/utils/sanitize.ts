/**
 * Supprime les octets nuls et les caractères de contrôle non imprimables
 * (garde \t, \n, \r qui peuvent être légitimes dans du texte long).
 * Point d'entrée universel : à appliquer sur tout champ saisi par l'utilisateur.
 */
export function sanitizeText(raw: string, maxLength = 2000): string {
  return raw
    .replace(/\0/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength)
}

/**
 * Pour les requêtes envoyées à Supabase `.ilike()`.
 * Échappe les caractères joker PostgreSQL (`%`, `_`, `\`) contenus dans
 * la saisie afin qu'ils soient interprétés littéralement plutôt que comme
 * des patterns — empêche l'injection de jokers non intentionnelle.
 */
export function sanitizeSearch(raw: string): string {
  return sanitizeText(raw, 200)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

/**
 * Pour les données interpolées dans une chaîne HTML brute (ex. WebView).
 * Encode les entités HTML pour éviter toute injection de balisage.
 */
export function sanitizeHtml(raw: string): string {
  return sanitizeText(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
