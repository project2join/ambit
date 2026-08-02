/*
  Konto löschen — unwiderruflich.
  Zuerst die Fotos aus dem Speicher, dann alles Übrige in der Datenbank
  (Profil, Pläne, Anfragen, Nachrichten und der Zugang selbst).
*/
import { supabase } from './supabase'

export async function deleteAccount(userId) {
  // 1) Alle Fotos dieser Person aus dem Speicher entfernen
  try {
    const { data: files } = await supabase.storage.from('photos').list(userId)
    if (files && files.length > 0) {
      await supabase.storage
        .from('photos')
        .remove(files.map((f) => `${userId}/${f.name}`))
    }
  } catch (e) {
    console.error('Fotos löschen fehlgeschlagen:', e)
  }

  // 2) Alles Übrige löscht die Datenbank in einem Zug
  const { error } = await supabase.rpc('delete_my_account')
  if (error) {
    console.error('Konto löschen fehlgeschlagen:', error.message)
    return false
  }

  // 3) Abmelden — der Zugang existiert nicht mehr
  await supabase.auth.signOut()
  return true
}
