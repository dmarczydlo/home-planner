export class DomainError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized") {
    super(401, message);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(404, `${resource} with id ${id} not found`);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Forbidden") {
    super(403, message);
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(400, message);
  }
}
