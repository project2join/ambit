/*
  Ortssuche für den Wohnort: Quartier, Ort oder PLZ eingeben,
  Vorschläge antippen. Genutzt wird die freie Photon-Suche
  (auf OpenStreetMap-Daten, ohne Schlüssel, kostenlos).

  Wichtig für die Privatsphäre: Wir speichern nur die Bezeichnung
  und GERUNDETE Koordinaten des Orts — nie eine Adresse.
*/
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPinIcon } from './Icons'

function LocationSearch({ onPick }) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null = noch nicht gesucht
  const [busy, setBusy] = useState(false)

  async function search(e) {
    e.preventDefault()
    if (!query.trim()) return
    setBusy(true)
    try {
      const lang = i18n.language === 'de' ? 'de' : 'en'
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=5&lang=${lang}`
      )
      const json = await res.json()

      setResults(
        (json.features || []).map((f) => {
          const p = f.properties
          // Lesbare Bezeichnung bauen, z. B. «Wipkingen, Zürich»
          const label = [
            p.name || p.postcode,
            p.city && p.city !== p.name ? p.city : null,
            p.country ? p.country : null,
          ]
            .filter(Boolean)
            .join(', ')
          return {
            label,
            area: [p.name || p.postcode, p.city && p.city !== p.name ? p.city : null]
              .filter(Boolean)
              .join(', '),
            // Auf 2 Nachkommastellen gerundet ≈ nur auf ~1 km genau
            lat: Math.round(f.geometry.coordinates[1] * 100) / 100,
            lng: Math.round(f.geometry.coordinates[0] * 100) / 100,
          }
        })
      )
    } catch {
      setResults([])
    }
    setBusy(false)
  }

  return (
    <div>
      <form onSubmit={search} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('location.searchPlaceholder')}
          className="flex-1 min-w-0 rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-mut outline-none focus:border-pine"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="rounded-full bg-pine px-5 text-[14px] font-semibold text-white disabled:opacity-40"
        >
          {busy ? '…' : t('location.search')}
        </button>
      </form>

      {/* Trefferliste */}
      {results && results.length === 0 && (
        <p className="text-[13px] text-mut mt-3">{t('location.noResults')}</p>
      )}
      {results && results.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(r)}
              className="flex items-center gap-2 text-left bg-paper border border-line rounded-xl px-4 py-3 text-[14px] text-ink"
            >
              <MapPinIcon size={15} className="text-pine flex-shrink-0" />
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LocationSearch
