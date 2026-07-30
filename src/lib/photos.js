/*
  Fotos hochladen und löschen (Supabase-Bucket "photos").
  Jeder Nutzer hat dort seinen eigenen Ordner: photos/<nutzer-id>/…
*/
import { supabase } from './supabase'

// Ein Foto hochladen; gibt den öffentlichen Link zurück (oder null bei Fehler)
export async function uploadPhoto(userId, file) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('photos').upload(path, file)
  if (error) {
    console.error('Foto-Upload fehlgeschlagen:', error.message)
    return null
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}

// Ein Foto aus dem Speicher löschen (anhand seines öffentlichen Links)
export async function deletePhoto(url) {
  const marker = '/photos/'
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = decodeURIComponent(url.slice(idx + marker.length))
  await supabase.storage.from('photos').remove([path])
}
