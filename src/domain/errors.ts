export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized") {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Forbidden") {
    super(message);
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
  }
}

export class ConflictError extends DomainError {
  constructor(
    message: string,
    public readonly conflictingEvents?: unknown[]
  ) {
    super(message);
  }
}

export class InternalError extends DomainError {
  constructor(message: string = "An internal error occurred") {
    super(message);
  }
}

export class RateLimitError extends DomainError {
  constructor(
    message: string,
    public readonly retryAfter: number
  ) {
    super(message);
  }
}
