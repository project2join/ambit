/*
  Foto-Raster: zeigt bis zu 5 Fotos, erlaubt Hochladen und Entfernen.
  Wird im Onboarding UND im «Ich»-Tab verwendet.
*/
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { uploadPhoto, deletePhoto } from '../lib/photos'
import { PlusIcon, XIcon } from './Icons'

const MAX_PHOTOS = 5

function PhotoGrid({ userId, photos, onChange }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false) // wird gerade hochgeladen?
  const [failed, setFailed] = useState(false) // ist ein Upload gescheitert?
  const fileRef = useRef(null) // Zugriff aufs unsichtbare Datei-Feld

  // Wird aufgerufen, wenn der Nutzer Dateien ausgewählt hat
  async function handleFiles(e) {
    const files = Array.from(e.target.files).slice(0, MAX_PHOTOS - photos.length)
    if (files.length === 0) return
    setBusy(true)
    setFailed(false)

    const newUrls = []
    for (const file of files) {
      const url = await uploadPhoto(userId, file)
      if (url) newUrls.push(url)
      else setFailed(true)
    }

    if (newUrls.length > 0) onChange([...photos, ...newUrls])
    setBusy(false)
    e.target.value = '' // Feld leeren, damit dieselbe Datei nochmal wählbar wäre
  }

  // Ein Foto entfernen (aus der Liste und aus dem Speicher)
  function removePhoto(index) {
    deletePhoto(photos[index])
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {/* Vorhandene Fotos */}
        {photos.map((url, i) => (
          <div key={url} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-line">
            <img src={url} alt="" className="w-full h-full object-cover" />
            {/* Das erste Foto ist das Hauptfoto */}
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold text-white bg-ink/60 px-1.5 py-0.5 rounded-full">
                {t('photos.main')}
              </span>
            )}
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label={t('common.remove')}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/55 text-white flex items-center justify-center"
            >
              <XIcon size={13} />
            </button>
          </div>
        ))}

        {/* Leere Plätze zum Hinzufügen */}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            disabled={busy}
            className="aspect-[3/4] rounded-xl border-[1.5px] border-dashed border-line text-mut flex flex-col items-center justify-center gap-1 disabled:opacity-50"
          >
            <PlusIcon size={16} />
            <span className="text-[11px]">
              {busy ? t('photos.uploading') : t('photos.add')}
            </span>
          </button>
        )}
      </div>

      {failed && (
        <p className="text-[13px] text-bordeaux mt-2">{t('photos.uploadError')}</p>
      )}

      {/* Unsichtbares Datei-Feld — öffnet die Foto-Auswahl des Geräts */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  )
}

export default PhotoGrid
