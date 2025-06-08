import { Usuario } from './usuarios/entities/usuario.entity';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        organizacion_id?: string;
      };
    }
  }
}
