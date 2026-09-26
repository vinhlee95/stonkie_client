export class UnauthenticatedError extends Error {
  constructor() {
    super('Not signed in')
    this.name = 'UnauthenticatedError'
  }
}
