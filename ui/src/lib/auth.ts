import { supabase } from '@/integrations/supabase/client';

export interface AppProfile {
  id: string;
  nombre: string;
  cargo: string;
  iniciales: string;
  rol: 'admin' | 'editor' | 'viewer';
  color: string;
}

const SESSION_KEY = 'conaf-defa-profile';

export async function loginWithCode(codigo: string): Promise<AppProfile | null> {
  // RPC SECURITY DEFINER: valida el código, actualiza ultimo_acceso y registra
  // el login. app_profiles ya no es legible con la anon key.
  const { data, error } = await (supabase as any).rpc('login_with_code', { p_codigo: codigo });

  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;

  const profile = row as AppProfile;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  return profile;
}

export function getStoredProfile(): AppProfile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppProfile;
  } catch {
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function canUpload(rol: string): boolean {
  return rol === 'admin' || rol === 'editor';
}

export function canDelete(rol: string): boolean {
  return rol === 'admin';
}

export function canExport(rol: string): boolean {
  return rol === 'admin' || rol === 'editor';
}
