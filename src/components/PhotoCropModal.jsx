/*
  Bildausschnitt wählen, bevor ein Foto hochgeladen wird.
  Zeigt das Bild in einem festen Hochformat-Rahmen (3:4, wie die
  Foto-Kacheln überall in der App). Man kann das Bild mit dem Finger/der
  Maus verschieben und über den Regler reinzoomen — so steuert man selbst,
  was auf dem Foto zu sehen ist. Kein Zuschneiden per fertiger Bibliothek,
  sondern von Hand mit <canvas> gebaut (siehe CLAUDE.md: keine neuen
  Bibliotheken ohne Rückfrage).
*/
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon, CheckIcon } from './Icons'

// Der Rahmen, in dem man den Ausschnitt wählt — 3:4 Hochformat,
// genau wie die Foto-Kacheln im Raster
const FRAME_W = 280
const FRAME_H = Math.round((FRAME_W * 4) / 3)
const MAX_ZOOM = 3

function PhotoCropModal({ file, onCancel, onDone }) {
  const { t } = useTranslation()
  const imgRef = useRef(null)
  const [imgUrl, setImgUrl] = useState('')
  const [natural, setNatural] = useState(null) // Original-Grösse des Bildes { w, h }
  const [zoom, setZoom] = useState(1)
  // Position der linken oberen Bildecke, in Pixeln relativ zum Rahmen
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null) // während des Ziehens: Startpunkt + Startposition
  const [saving, setSaving] = useState(false)

  // Die ausgewählte Datei in eine anzeigbare Bild-Adresse umwandeln
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Die Grundgrösse: das Bild deckt den ganzen Rahmen ab (wie
  // object-fit: cover) — bei Zoom 1 sieht man also schon alles ausser
  // den überstehenden Rändern. Reinzoomen zeigt danach weniger vom Bild.
  function baseScale(w, h) {
    return Math.max(FRAME_W / w, FRAME_H / h)
  }

  function dispSize(z, n = natural) {
    const s = baseScale(n.w, n.h) * z
    return { w: n.w * s, h: n.h * s }
  }

  // Verschieben nie über den Bildrand hinaus zulassen — sonst gäbe es
  // eine leere Ecke im Ausschnitt
  function clamp(p, z) {
    const { w, h } = dispSize(z)
    return {
      x: Math.min(0, Math.max(FRAME_W - w, p.x)),
      y: Math.min(0, Math.max(FRAME_H - h, p.y)),
    }
  }

  // Bild ist geladen: Grösse merken und mittig im Rahmen platzieren
  function handleImgLoad() {
    const w = imgRef.current.naturalWidth
    const h = imgRef.current.naturalHeight
    setNatural({ w, h })
    const s = baseScale(w, h)
    setPos({ x: (FRAME_W - w * s) / 2, y: (FRAME_H - h * s) / 2 })
  }

  // Ziehen zum Verschieben — funktioniert mit Maus und Finger gleichermassen
  function onPointerDown(e) {
    if (!natural || !e.isPrimary) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y }
  }
  function onPointerMove(e) {
    if (!dragRef.current || !e.isPrimary) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setPos(clamp({ x: dragRef.current.posX + dx, y: dragRef.current.posY + dy }, zoom))
  }
  function onPointerUp() {
    dragRef.current = null
  }

  // Regler bewegt: zoomen, aber die Bildmitte des aktuellen Ausschnitts
  // möglichst an derselben Stelle lassen (kein Sprung beim Regeln)
  function handleZoom(e) {
    const z = Number(e.target.value)
    const old = dispSize(zoom)
    const fx = (FRAME_W / 2 - pos.x) / old.w
    const fy = (FRAME_H / 2 - pos.y) / old.h
    const next = dispSize(z)
    setZoom(z)
    setPos(clamp({ x: FRAME_W / 2 - fx * next.w, y: FRAME_H / 2 - fy * next.h }, z))
  }

  // Übernehmen: das, was gerade im Rahmen sichtbar ist, auf ein <canvas>
  // in fester Auflösung zeichnen — der Rest des Bildes fällt weg
  function handleApply() {
    setSaving(true)
    const targetW = 900
    const targetH = Math.round((targetW * 4) / 3)
    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')

    // Umrechnung von Rahmen-Pixeln (was man sieht) auf Canvas-Pixel
    // (was gespeichert wird) — beide haben dasselbe Seitenverhältnis 3:4
    const scale = targetW / FRAME_W
    const { w, h } = dispSize(zoom)
    // Das ganze Originalbild zeichnen, aber so positioniert/skaliert,
    // dass exakt der im Rahmen sichtbare Ausschnitt im Canvas landet
    // (was ausserhalb des Canvas liegt, wird automatisch abgeschnitten)
    ctx.drawImage(imgRef.current, pos.x * scale, pos.y * scale, w * scale, h * scale)

    canvas.toBlob(
      (blob) => {
        setSaving(false)
        if (blob) onDone(blob)
      },
      'image/jpeg',
      0.9
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/90 flex flex-col items-center justify-center px-5">
      <p className="font-serif text-[17px] font-medium text-white mb-4 text-center">
        {t('photos.cropTitle')}
      </p>

      {/* Der Ausschnitt-Rahmen: Bild lässt sich darin ziehen */}
      <div
        className="relative rounded-2xl overflow-hidden touch-none select-none bg-ink/40"
        style={{ width: FRAME_W, height: FRAME_H }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {imgUrl && (
          <img
            ref={imgRef}
            src={imgUrl}
            alt=""
            onLoad={handleImgLoad}
            draggable={false}
            style={
              natural
                ? {
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: dispSize(zoom).w,
                    height: dispSize(zoom).h,
                    maxWidth: 'none',
                  }
                : { display: 'none' }
            }
          />
        )}
      </div>

      <p className="text-[12px] text-white/70 mt-3 text-center max-w-[280px]">
        {t('photos.cropHint')}
      </p>

      {/* Zoom-Regler */}
      <input
        type="range"
        min="1"
        max={MAX_ZOOM}
        step="0.01"
        value={zoom}
        onChange={handleZoom}
        disabled={!natural}
        className="w-full max-w-[280px] mt-4"
      />

      {/* Abbrechen / Übernehmen */}
      <div className="flex items-center gap-3 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="smooth w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center"
          aria-label={t('photos.cropCancel')}
        >
          <XIcon size={20} />
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={!natural || saving}
          className="smooth w-12 h-12 rounded-full bg-pine text-white flex items-center justify-center disabled:opacity-40"
          aria-label={t('photos.cropApply')}
        >
          <CheckIcon size={20} />
        </button>
      </div>
    </div>
  )
}

export default PhotoCropModal
