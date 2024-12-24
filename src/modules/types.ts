export type ModuleType = 'scripture' | 'acting';
export type UserRole = 'user' | 'premium' | 'admin';

export interface Module {
  id: ModuleType;
  name: string;
  description: string;
  enabled: boolean;
  requiredRole: UserRole;
  icon: string;
  routes: string[];
}

export interface UserModuleSettings {
  userId: string;
  enabledModules: ModuleType[];
  role: UserRole;
}
