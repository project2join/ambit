/*
  Laden und Speichern des Profils in der Supabase-Tabelle "profiles".
  Alle Teile der App nutzen diese zwei Funktionen — so bleibt es einheitlich.
*/
import { supabase } from './supabase'

// Das eigene Profil laden (null, wenn es noch keines gibt)
export async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return { profile: data, error }
}

// Einzelne Felder speichern. upsert = anlegen, falls es die Zeile
// noch nicht gibt, sonst ändern.
export async function saveProfile(userId, fields) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...fields })
  if (error) {
    // Fehler in der Konsole zeigen, damit wir beim Entwickeln etwas sehen
    console.error('Profil speichern fehlgeschlagen:', error.message)
  }
  return !error
}
