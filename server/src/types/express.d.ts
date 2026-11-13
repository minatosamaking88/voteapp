declare global {
  namespace Express {
    interface Locals {
      authenticatedUser: {
        id: string;
        name: string;
      };
    }
  }
}

export {};
