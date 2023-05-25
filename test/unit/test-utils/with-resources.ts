export function withResource<A, B>(resource: A, close: (a: A) => void, run: (a: A) => B): B {
  try {
    return run(resource)
  } finally {
    close(resource)
  }
}
