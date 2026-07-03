import { supabase } from '@/integrations/supabase/client';

export interface AppProfile {
  id: string;
  nombre: string;
  cargo: string;
  iniciales: string;
  rol: 'admin' | 'editor' | 'viewer';
  color: string;
}

async function loadProfile(userId: string): Promise<AppProfile | null> {
  const { data, error } = await (supabase as any)
    .from('app_profiles')
    .select('id, nombre, cargo, iniciales, rol, color')
    .eq('user_id', userId)
    .eq('activo', true)
    .single();
  if (error || !data) return null;

  // Registrar acceso (best-effort, no bloquea el login)
  (supabase as any).from('app_profiles').update({ ultimo_acceso: new Date().toISOString() }).eq('id', data.id).then(() => {});
  (supabase as any).from('access_log').insert({ profile_id: data.id, accion: 'login', detalle: `${data.nombre} ingresó al sistema` }).then(() => {});

  return data as AppProfile;
}

export async function signIn(email: string, password: string): Promise<{ profile: AppProfile | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.user) {
    return { profile: null, error: 'Credenciales incorrectas' };
  }
  const profile = await loadProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return { profile: null, error: 'Tu cuenta no tiene un perfil asignado. Contacta al administrador.' };
  }
  return { profile, error: null };
}

export async function getCurrentProfile(): Promise<AppProfile | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  return loadProfile(data.session.user.id);
}

export function onAuthChange(cb: (profile: AppProfile | null) => void) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      cb(null);
      return;
    }
    cb(await loadProfile(session.user.id));
  });
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
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
