declare module 'passport-custom' {
  import { Strategy as PassportStrategy } from 'passport';
  import { Request } from 'express';

  export class Strategy extends PassportStrategy {
    constructor(
      verify: (
        req: Request,
        done: (error: unknown, user?: unknown) => void,
      ) => void,
    );
    name: string;
  }
}
