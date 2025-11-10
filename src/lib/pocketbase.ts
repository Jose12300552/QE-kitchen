import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');

// Habilitar auto-cancelación de requests duplicados
pb.autoCancellation(false);

// Tipos para los roles
export type UserRole = 'admin' | 'cocinero' | 'mesero';

// Interfaz extendida del usuario
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
}