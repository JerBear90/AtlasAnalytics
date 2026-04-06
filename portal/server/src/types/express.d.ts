import { UserProfile } from '../types';

declare global {
  namespace Express {
    interface User extends UserProfile {}
    interface Request {
      user?: UserProfile;
      token?: string;
    }
  }
}
