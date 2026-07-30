/*
  Verbindung zu Supabase (unsere Datenbank + Login-Dienst).
  Die Zugangsdaten kommen aus der Datei .env.local —
  sie stehen absichtlich NICHT hier im Code.
*/
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Früh und deutlich warnen, falls die Zugangsdaten fehlen
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase-Zugangsdaten fehlen. Bitte .env.local prüfen und den Server neu starten.'
  )
}

// Dieses eine "supabase"-Objekt nutzt die ganze App für Login & Daten
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
