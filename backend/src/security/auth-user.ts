export interface AuthUser {
  id: number;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  permissions: string[];
}
