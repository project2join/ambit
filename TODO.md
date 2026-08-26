# Ambit — Offene Punkte (nicht vergessen!)

## Versprochen, kommt noch
- **Verifizierung automatisieren** — läuft aktuell von Hand: Selfie kommt
  über die App in den privaten Bucket `verification`, du schaust es an und
  setzt in `verification_requests` den Status auf `approved` oder `rejected`
  (das Häkchen wird dann automatisch gesetzt, das Selfie gelöscht).
  Später: ein Dienst gleicht Selfie und Profilfoto selbst ab — Achtung,
  biometrische Daten brauchen eine saubere rechtliche Grundlage.
- **Profil pausieren** — Knopf im «Ich»-Tab: unsichtbar werden, ohne dass
  Daten verloren gehen; jederzeit reaktivierbar.
- **Benachrichtigungen** wirklich verschicken (E-Mail oder Push). Die
  Schalter im «Ich»-Tab speichern die Wahl schon, es passiert nur noch nichts.
- **Treffpunkt als eigenes Feld** beim Plan-Erstellen. Aktuell steckt der Ort
  im Plan-Text; «Plan teilen» schickt darum den ganzen Text mit.
- **Magic-Link-Mail auf Deutsch** übersetzen
  (Supabase → Authentication → Email Templates).
- **Meldungen und Feedback anschauen**: Die Tabellen `reports` und
  `feedback` in Supabase regelmässig prüfen — es gibt noch keine
  Benachrichtigung darüber. Feedback kommt bewusst nicht per Mail, damit
  deine Adresse nirgends in der App sichtbar ist (Wunsch vom 2026-08-16).
  Falls später doch eine Mail-Benachrichtigung gewünscht ist: über einen
  Datenbank-Trigger + Resend (sobald Resend eh für den Mail-Versand
  eingerichtet ist, siehe Launch-Checkliste unten).

## Für die erste Testrunde mit echten Leuten (ab 2026-08-16)
- Testrunde läuft asynchron: Leute testen «wann sie mögen», nicht alle
  gleichzeitig. Deshalb lohnt sich bald eine einfache Benachrichtigung
  (z. B. Mail bei neuer Anfrage/Nachricht/Zusage) — sonst verpassen
  Testende Dinge und die App wirkt "tot". Sinnvoll, sobald eh ein
  eigener Mail-Versand eingerichtet ist (siehe Punkt unten).
- Deploy auf Vercel + eigener Mail-Versand (Gmail-SMTP als schnelle
  Zwischenlösung ohne Domain) sind im Gang — siehe Chat-Verlauf vom
  2026-08-16 für die genauen Schritte.

## Nächste grosse Schritte
- Feed-Sortierung nach «So treffe ich mich gern» (Gruppe/zu zweit):
  passende Pläne zuerst zeigen — nie ausblenden
- Entdecken-Tab (Dating-Set, beidseitige Matches) — füllt auch
  «Du gefällst» in den Verbindungen
- Orte-Tab (private Orte, beidseitige Aufdeckung)

## Vor dem echten Start (Launch-Checkliste)
- **Eigener Mail-Versand (SMTP) in Supabase hinterlegen** — der eingebaute
  Versand ist nur zum Entwickeln und erlaubt nur wenige Mails pro Stunde.
  Ohne das können sich echte Nutzer nicht anmelden. Für die Beta reicht
  Gmail-SMTP über project2join@gmail.com (App-Passwort, kein eigener
  Domain nötig). Für den echten Start dann auf einen Dienst wie Resend,
  Postmark oder SendGrid mit eigener Domain wechseln — sonst landen
  Anmelde-Mails eher im Spam. Einzurichten unter Supabase → Project
  Settings → Authentication → SMTP Settings.
- Supabase-Gratis-Projekte werden nach längerer Inaktivität pausiert —
  vor dem Start auf einen bezahlten Plan wechseln.
- Datenschutzerklärung und Nutzungsbedingungen (Pflicht bei einer App mit
  Fotos, Standort und Dating-Funktion).

## Ideen für später
- «Gerne wieder» in grösseren Gruppen: aktuell ein Tipp fürs ganze Treffen.
  Falls gewünscht, später zusätzlich einzelne Personen anschreiben können.

## Technisch härten (später)
- Anfrage-Statuswechsel serverseitig absichern (aktuell könnte eine
  technisch versierte Person ihre eigene Anfrage per API annehmen —
  Lösung: Statuswechsel über eine Datenbank-Funktion statt direktem Update)
- «Sanfter Korb» auch auf API-Ebene verbergen (declined-Status ist im
  Netzwerk-Tab theoretisch sichtbar, die Oberfläche zeigt ihn nie)
