// reason: captureStackTrace est exposé par Hermes (V8-compatible) mais n'est pas
// dans les types DOM/RN ; @types/node n'est pas une dépendance de l'app.
interface ErrorConstructor {
  captureStackTrace?(target: object, constructor?: abstract new (...args: never[]) => unknown): void
}
