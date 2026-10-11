const NUMERIC_KEY = /^\d+$/

type StyleObject = Record<string, unknown>
type ElementProps = { style?: unknown } & Record<string, unknown>
type CreateElement = (type: unknown, props: ElementProps | null, ...rest: unknown[]) => unknown
type CloneElement = (element: unknown, props: ElementProps | null, ...rest: unknown[]) => unknown

interface MutableReact {
  createElement: CreateElement
  cloneElement: CloneElement
}

function isPlainObject(value: unknown): value is StyleObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Reconnaît un objet issu de { ...unTableau } : toutes les clés sont des entiers.
function isSpreadArray(value: unknown): value is StyleObject {
  if (!isPlainObject(value)) return false
  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => NUMERIC_KEY.test(key))
}

function restoreArray(spread: StyleObject): unknown[] {
  const length = Math.max(...Object.keys(spread).map(Number)) + 1
  return Array.from({ length }, (_, index) => spread[String(index)])
}

function flattenStyle(style: unknown): StyleObject {
  const flat: StyleObject = {}
  const collect = (part: unknown): void => {
    if (Array.isArray(part)) part.forEach(collect)
    else if (isPlainObject(part)) Object.assign(flat, part)
  }
  collect(style)
  return flat
}

function dropNumericKeys(style: StyleObject): StyleObject {
  return Object.fromEntries(
    Object.entries(style).filter(([key]) => !NUMERIC_KEY.test(key)),
  )
}

function normalizeDomStyle(style: unknown): unknown {
  if (Array.isArray(style)) return flattenStyle(style)
  if (isPlainObject(style) && Object.keys(style).some((k) => NUMERIC_KEY.test(k))) {
    return dropNumericKeys(style)
  }
  return style
}

function patchCreateElement(react: MutableReact): void {
  const original = react.createElement
  react.createElement = (type, props, ...rest) => {
    const needsFix = typeof type === 'string' && props?.style != null
    const fixed = needsFix ? { ...props, style: normalizeDomStyle(props.style) } : props
    return original(type, fixed, ...rest)
  }
}

function patchCloneElement(react: MutableReact): void {
  const original = react.cloneElement
  react.cloneElement = (element, props, ...rest) => {
    const needsFix = props?.style != null && isSpreadArray(props.style)
    const fixed = needsFix ? { ...props, style: restoreArray(props.style as StyleObject) } : props
    return original(element, fixed, ...rest)
  }
}

/**
 * Évite « Failed to set an indexed property on CSSStyleDeclaration » sur le web.
 *
 * 1. Des composants passent style={[…]} à des éléments DOM natifs : on aplatit.
 * 2. @radix-ui/react-slot (Link asChild) fusionne par spread un style tableau en
 *    { '0': …, '1': … } : on le restaure en tableau pour que styleq le traite.
 */
export function installWebStyleFix(): void {
  if (typeof window === 'undefined') return
  // reason: il faut l'objet module mutable ; un `import *` est copié par l'interop
  // de Metro et le patch n'atteindrait pas le React réellement utilisé.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const react = require('react') as MutableReact
  patchCreateElement(react)
  patchCloneElement(react)
}
