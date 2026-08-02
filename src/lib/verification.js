/*
  Verifizierung: ein Selfie mit einer zufälligen Geste, direkt in der App.

  Die Geste («Hand ans Ohr», «Peace-Zeichen», «Daumen hoch») verhindert,
  dass jemand ein fremdes Foto einreicht — der Betreiber vergleicht sie
  mit den Profilfotos. Das Selfie landet in einem privaten Speicher,
  ist für niemanden abrufbar und wird nach der Prüfung gelöscht.
*/
import { supabase } from './supabase'

export const GESTURES = ['ear', 'peace', 'thumb']

// Zufällige Geste für den nächsten Versuch
export function randomGesture() {
  return GESTURES[Math.floor(Math.random() * GESTURES.length)]
}

// Den letzten Stand der eigenen Prüfung laden (null = noch nie versucht)
export async function loadMyVerification(userId) {
  const { data } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

// Selfie hochladen und zur Prüfung anmelden
export async function submitVerification(userId, file, gesture) {
  const ext = file.name?.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('verification')
    .upload(path, file)
  if (upErr) {
    console.error('Selfie hochladen fehlgeschlagen:', upErr.message)
    return false
  }

  const { error } = await supabase
    .from('verification_requests')
    .insert({ user_id: userId, gesture, photo_path: path })
  if (error) {
    console.error('Prüfung anmelden fehlgeschlagen:', error.message)
    return false
  }
  return true
}
