import { useState } from "react";
import {
  Home, Compass, Plus, MapPin, User, Check, X, Heart, Lock,
  Dumbbell, Coffee, UtensilsCrossed, Sparkles, BadgeCheck, Clock, Shield, Users, Mountain,
  MessageCircle, Repeat, MoreHorizontal
} from "lucide-react";

// ---------- Design Tokens ----------
const C = {
  ink: "#191813",        // warmes Fast-Schwarz
  paper: "#F6F4EF",      // Elfenbein
  card: "#FFFFFF",
  green: "#33473C",      // tiefes Tannengruen (Freundschaft/Aktion)
  greenSoft: "#E9EBE2",
  coral: "#7E3B43",      // Bordeaux (Dating-Momente)
  coralDeep: "#652E36",
  coralSoft: "#F1E5E3",
  line: "#E7E2D7",       // warme Haarlinien
  sub: "#6E695D",
  mut: "#9C9689",
};

const CATS = [
  { id: "sport", label: "Sport", Icon: Dumbbell },
  { id: "kaffee", label: "Kaffee", Icon: Coffee },
  { id: "essen", label: "Essen", Icon: UtensilsCrossed },
  { id: "ausgang", label: "Ausgang", Icon: Sparkles },
];

const START_PLANS = [
  {
    id: "p1", mine: false, name: "Lea", age: 28, avatar: "#C6CDC0", cat: "sport",
    text: "Ich geh eh Donnerstag bouldern — 19 Uhr, Kreis 5. Wer kommt mit?",
    when: "Do · 19:00", spots: 3, taken: 1, filters: "25–35 · verifiziert",
  },
  {
    id: "p2", mine: false, name: "Marco", age: 31, avatar: "#D0CAD6", cat: "kaffee",
    text: "Samstagvormittag Kafi & Gipfeli am See. Ich bin eh da.",
    when: "Sa · 10:00", spots: 4, taken: 1, filters: "alle · verifiziert",
  },
  {
    id: "p3", mine: false, name: "Aylin", age: 26, avatar: "#DCC9A6", cat: "ausgang",
    text: "Will diese Woche ins Kino — Tag noch offen. Wer kommt mit?",
    when: "Diese Woche", flex: true, spots: 2, taken: 1, filters: "20–32 · Frauen",
  },
];

const DECK = [
  {
    id: "livia", name: "Livia", age: 29, avatar: "#DFD3BD", photos: ["#DFD3BD", "#BFD9D4"],
    cats: ["Sport", "Essen"],
    q: "Nimm mich mit zu…", a: "jedem Berg, der eine Beiz oben hat.",
    q2: "Teilst du dein Essen? Sei ehrlich.", a2: "Ja — aber Tausch ist Pflicht.",
    shared: "Will Samstag auch bouldern",
    signal: "Ich geh Samstag eh bouldern — kommst du mit?",
  },
  {
    id: "sofia", name: "Sofia", age: 27, avatar: "#D9C4B2", photos: ["#D9C4B2", "#DFD3BD"],
    cats: ["Sport", "Kaffee"],
    q: "Perfekter Sonntag", a: "Bouldern, dann Brunch, bis er zum Zmittag wird.",
    q2: "Dafür stehe ich freiwillig um 6 Uhr morgens auf:", a2: "Erste Gondel, leere Piste.",
    shared: "Will diese Woche auch bouldern",
  },
  {
    id: "noah", name: "Noah", age: 30, avatar: "#C3CDD4", photos: ["#C3CDD4", "#CCD0C2"],
    cats: ["Essen", "Ausgang"], rel: "Offene Beziehung",
    q: "Ich überzeuge dich mit", a: "der besten Ramen-Adresse der Stadt. Beweis folgt.",
    q2: "Teilst du dein Essen? Sei ehrlich.", a2: "Nein. Aber ich bestelle für zwei.",
    shared: "Auch offen für Vierer-Dates",
  },
  {
    id: "mara", name: "Mara", age: 25, avatar: "#C9D0BB", photos: ["#C9D0BB", "#D6C4CA"],
    cats: ["Sport", "Ausgang"],
    q: "Grüne Flagge", a: "Leute, die auch mal spontan Ja sagen.",
    q2: "Ohne Ziel in den nächsten Zug steigen — Traum oder Albtraum?", a2: "Traum — die Endstation entscheidet.",
    shared: "Trainiert auch im Kreis 5",
  },
];

// Kurzprofile (sichtbar vor einer Verbindung: 1 Foto, Basics, 1 Antwort)
const PROFILES = {
  Lea: { name: "Lea", age: 28, color: "#C6CDC0", city: "Zürich", langs: "DE/CH/EN", cats: ["Sport"], q: "Nimm mich mit zu…", a: "jeder Kletterhalle, die ich noch nicht kenne." },
  Marco: { name: "Marco", age: 31, color: "#D0CAD6", city: "Zürich", langs: "DE/IT", cats: ["Kaffee", "Essen"], q: "Teilst du dein Essen? Sei ehrlich.", a: "Gipfeli ja. Pommes niemals." },
  Aylin: { name: "Aylin", age: 26, color: "#DCC9A6", city: "Winterthur", langs: "DE/EN", cats: ["Ausgang"], q: "Dafür stehe ich freiwillig um 6 Uhr morgens auf:", a: "Flohmärkte. Die guten Sachen sind um 8 weg." },
  Jonas: { name: "Jonas", age: 29, color: "#C0C9D1", city: "Zürich", langs: "DE/EN", cats: ["Ausgang", "Sport"], q: "Zuletzt allein gemacht — wäre zu zweit besser gewesen:", a: "Bowling. Gegen sich selbst verlieren ist hart." },
  Elif: { name: "Elif", age: 27, color: "#D6C4CA", city: "Zürich", langs: "DE/TR/EN", cats: ["Ausgang", "Kaffee"], q: "Nimm mich mit zu…", a: "allem, wo man danach etwas erzählen kann." },
};

const PROMPT_QS = [
  "Ich geh eh regelmässig… — kommst du mit?",
  "Nimm mich mit zu…",
  "Zuletzt allein gemacht — wäre zu zweit besser gewesen:",
  "Zu zweit gemacht — wäre allein besser gewesen:",
  "Darin will ich dieses Jahr besser werden:",
  "Teilst du dein Essen? Sei ehrlich.",
  "Was hast du zuletzt aus Angst nicht gemacht?",
  "Wenn du ein Buch schreiben müsstest — worüber?",
  "Ohne Ziel in den nächsten Zug steigen — Traum oder Albtraum?",
  "Dafür stehe ich freiwillig um 6 Uhr morgens auf:",
];
const ANSWERED_QS = [PROMPT_QS[0], PROMPT_QS[8]];

const START_REQUESTS = [
  { id: "r1", name: "Jonas", age: 29, avatar: "#C0C9D1", note: "Bowlt seit dem Studium. Verspricht, nicht zu gewinnen." },
  { id: "r2", name: "Elif", age: 27, avatar: "#D6C4CA", note: "Neu in Zürich, sucht genau sowas." },
];

// ---------- Kleine Bausteine ----------
const Avatar = ({ color, name, size = 44 }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2, background: color,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: C.ink, fontWeight: 600, fontSize: size * 0.4, flexShrink: 0,
    fontFamily: "'Fraunces', sans-serif",
  }}>{name[0]}</div>
);

const Chip = ({ active, onClick, children, warm }) => (
  <button onClick={onClick} style={{
    padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
    border: `1px solid ${active ? "transparent" : C.line}`,
    background: active ? (warm ? C.coral : C.ink) : C.card,
    color: active ? "#fff" : C.sub, cursor: "pointer", whiteSpace: "nowrap",
    transition: "all .15s",
  }}>{children}</button>
);

const SpotDots = ({ spots, taken }) => (
  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
    {Array.from({ length: spots }).map((_, i) => (
      <span key={i} style={{
        width: 9, height: 9, borderRadius: 5,
        background: i < taken ? C.green : "transparent",
        border: `1.5px solid ${C.green}`,
      }} />
    ))}
    <span style={{ fontSize: 12, color: C.sub, marginLeft: 4 }}>
      {spots - taken} von {spots} frei
    </span>
  </div>
);

// ---------- App ----------
export default function EhApp() {
  const [tab, setTab] = useState("plaene");
  const [catFilter, setCatFilter] = useState("alle");
  const [plans, setPlans] = useState(START_PLANS);
  const [requested, setRequested] = useState({});
  const [requests, setRequests] = useState(START_REQUESTS);
  const [myTaken, setMyTaken] = useState(1);
  const [seen, setSeen] = useState([]);
  const [discCat, setDiscCat] = useState("alle");
  const [signals, setSignals] = useState(2);
  const [match, setMatch] = useState(null); // {profile, stage}
  const [viewProfile, setViewProfile] = useState(null);
  const [places, setPlaces] = useState([
    { id: "gym", name: "Puls Fitness, Kreis 5", kind: "gym", count: 6, interested: false },
  ]);
  const [myPhotos, setMyPhotos] = useState(["#D9C4B2", "#C6CDC0", "#D0CAD6"]);
  const [connOpen, setConnOpen] = useState(false);
  const [joined, setJoined] = useState({ p2: true });
  const [matches, setMatches] = useState([
    { id: "m0", name: "Amir", color: "#C5CAD8", days: 6, last: "Der Vierer am Donnerstag steht — freu mich!" },
  ]);
  const [nextTime, setNextTime] = useState({});
  const [likeFor, setLikeFor] = useState(null);
  const [likeMsg, setLikeMsg] = useState("");
  const [menuFor, setMenuFor] = useState(null);
  const [connTab, setConnTab] = useState("plaene");
  const [placePicker, setPlacePicker] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [toast, setToast] = useState(null);
  // Erstellen-Form
  const [fText, setFText] = useState("");
  const [fCat, setFCat] = useState("sport");
  const [fWhen, setFWhen] = useState("Do Abend");
  const [fFlex, setFFlex] = useState(false);
  const [dateFor, setDateFor] = useState(null);
  const [reqFor, setReqFor] = useState(null);
  const [reqDays, setReqDays] = useState([]);
  const [fSpots, setFSpots] = useState(3);
  const [fAgeMin, setFAgeMin] = useState(24);
  const [fAgeMax, setFAgeMax] = useState(36);
  const [fGender, setFGender] = useState("Alle");
  const [fVerified, setFVerified] = useState(true);
  // Profil
  const [seek, setSeek] = useState({ freundschaft: true, dating: true });
  const [meet, setMeet] = useState({ gruppe: true, einzeln: true });
  const [langs, setLangs] = useState(["Deutsch", "Schweizerdeutsch", "Englisch"]);
  const [rhythm, setRhythm] = useState(["Abends", "Wochenende"]);
  const [radius, setRadius] = useState(10);
  const [uiLang, setUiLang] = useState("DE");
  const [otherLangs, setOtherLangs] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [thirdQ, setThirdQ] = useState(null);
  const [thirdA, setThirdA] = useState("");
  const [thirdSaved, setThirdSaved] = useState(false);
  const [orient, setOrient] = useState("Alle");
  const [relModel, setRelModel] = useState(null);
  const [showOpenRel, setShowOpenRel] = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const requestJoin = (id) => {
    setRequested({ ...requested, [id]: true });
    showToast("Anfrage gesendet — du hörst von uns.");
  };

  const acceptReq = (r) => {
    setRequests(requests.filter((x) => x.id !== r.id));
    setMyTaken(myTaken + 1);
    showToast(`${r.name} ist dabei ✓`);
  };
  const softDecline = (r) => {
    setRequests(requests.filter((x) => x.id !== r.id));
    showToast(`${r.name} sieht nur: «Plan ist voll».`);
  };

  const likeProfile = (p) => setLikeFor(p);
  const sendLike = (p, msg) => {
    setLikeFor(null); setLikeMsg("");
    if (signals <= 0) return;
    setSignals(signals - 1);
    if (p.signal) {
      setMatch({ profile: p, stage: "match" });
    } else {
      showToast(msg.trim() ? "Signal mit Nachricht gesendet — sichtbar nur bei Gegenseitigkeit." : "Signal gesendet — sichtbar nur bei Gegenseitigkeit.");
      setSeen([...seen, p.id]);
    }
  };
  const skipProfile = (p) => setSeen([...seen, p.id]);

  const publishPlan = () => {
    if (!fText.trim()) { showToast("Sag kurz, wohin du eh gehst."); return; }
    setPlans([{
      id: "mine-" + Date.now(), mine: true, name: "Du", age: 28, avatar: C.greenSoft,
      cat: fCat, text: fText, when: fWhen, flex: fFlex, spots: fSpots, taken: 0,
      filters: `${fAgeMin}–${fAgeMax === 65 ? "65+" : fAgeMax} · ${fGender}${fVerified ? " · verifiziert" : ""}`,
    }, ...plans]);
    setFText("");
    setTab("plaene");
    showToast("Plan ist live — sichtbar nur für deine Filter.");
  };

  const visiblePlans = catFilter === "alle" ? plans : plans.filter((p) => p.cat === catFilter);
  const discLabel = CATS.find((c) => c.id === discCat)?.label;
  const filteredDeck = discCat === "alle" ? DECK : DECK.filter((p) => p.cats.includes(discLabel));
  const profile = filteredDeck.find((p) => !seen.includes(p.id));
  const deckDone = !profile || signals <= 0;
  const incomingSignals = DECK.filter((p) => p.signal && !seen.includes(p.id));
  const connCount = requests.length + incomingSignals.length + matches.length;

  // ---------- Screens ----------
  const Plaene = () => (
    <div style={{ padding: "16px 18px 24px" }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
        <Chip active={catFilter === "alle"} onClick={() => setCatFilter("alle")}>Alle</Chip>
        {CATS.map((c) => (
          <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>{c.label}</Chip>
        ))}
      </div>

      {/* Eigener Plan mit Anfragen */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, letterSpacing: 0.3 }}>DEIN PLAN</div>
          {requests.length > 0 && (
            <span style={{ fontSize: 12, background: C.coralSoft, color: C.coralDeep, padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>
              {requests.length} Anfrage{requests.length > 1 ? "n" : ""}
            </span>
          )}
        </div>
        <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 17, fontWeight: 600, color: C.ink, margin: "8px 0 6px" }}>
          «Ich geh eh Freitag bowlen — 20 Uhr.»
        </div>
        <SpotDots spots={4} taken={myTaken} />
        {requests.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            <div onClick={() => setViewProfile(PROFILES[r.name])} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, cursor: "pointer" }}>
              <Avatar color={r.avatar} name={r.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{r.name}, {r.age}</div>
                <div style={{ fontSize: 12, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.note}</div>
              </div>
            </div>
            <button onClick={() => acceptReq(r)} aria-label="Annehmen" style={{
              width: 36, height: 36, borderRadius: 18, background: C.green, border: "none", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}><Check size={18} /></button>
            <button onClick={() => softDecline(r)} aria-label="Plan voll" style={{
              width: 36, height: 36, borderRadius: 18, background: C.card, border: `1px solid ${C.line}`, color: C.mut,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}><X size={18} /></button>
          </div>
        ))}
        {requests.length === 0 && (
          <div style={{ fontSize: 12, color: C.mut, marginTop: 10 }}>Keine offenen Anfragen.</div>
        )}
      </div>

      {/* Pläne von anderen */}
      {visiblePlans.map((p) => {
        const cat = CATS.find((c) => c.id === p.cat);
        return (
          <div key={p.id} onClick={() => !p.mine && PROFILES[p.name] && setViewProfile(PROFILES[p.name])} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, marginBottom: 12, cursor: p.mine ? "default" : "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar color={p.avatar} name={p.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, display: "flex", alignItems: "center", gap: 5 }}>
                  {p.name}, {p.age} <BadgeCheck size={15} color={C.green} />
                </div>
                <div style={{ fontSize: 12, color: C.mut, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  {cat && <cat.Icon size={13} />} {cat?.label} · {p.when}
                  {p.flex && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, color: C.sub, background: C.paper, border: `1px solid ${C.line}`, padding: "2px 7px", borderRadius: 999, marginLeft: 2 }}>DATUM FOLGT</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 17, fontWeight: 500, lineHeight: 1.35, color: C.ink, margin: "12px 0" }}>
              «{p.text}»
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <SpotDots spots={p.spots} taken={p.taken} />
                <div style={{ fontSize: 11, color: C.mut, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                  <Shield size={11} /> sichtbar für: {p.filters}
                </div>
              </div>
              {p.mine && p.flex && (
                <button onClick={(e) => { e.stopPropagation(); setDateFor(p.id); }} style={{
                  padding: "10px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: C.ink, color: "#fff", fontSize: 13.5, fontWeight: 600,
                }}>Datum festlegen</button>
              )}
              {!p.mine && (
                <button onClick={(e) => { e.stopPropagation(); p.flex && !requested[p.id] ? setReqFor(p.id) : requestJoin(p.id); }} disabled={requested[p.id] || joined[p.id]} style={{
                  padding: "10px 18px", borderRadius: 999, border: "none", cursor: (requested[p.id] || joined[p.id]) ? "default" : "pointer",
                  background: (requested[p.id] || joined[p.id]) ? C.greenSoft : C.green,
                  color: (requested[p.id] || joined[p.id]) ? C.green : "#fff", fontSize: 14, fontWeight: 600,
                }}>{joined[p.id] ? "Dabei ✓" : requested[p.id] ? "Angefragt ✓" : "Anfragen"}</button>
              )}
            </div>
            {!p.mine && !joined[p.id] && (
              <button onClick={(e) => { e.stopPropagation(); if (!nextTime[p.id]) showToast("Der Host sieht: +1 fürs nächste Mal."); setNextTime({ ...nextTime, [p.id]: !nextTime[p.id] }); }} style={{
                background: "none", border: "none", padding: 0, marginTop: 12, cursor: "pointer",
                fontSize: 12.5, fontWeight: 600, color: nextTime[p.id] ? C.green : C.mut,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Repeat size={13} /> {nextTime[p.id] ? "Beim nächsten Mal dabei — du wirst benachrichtigt" : "Passt heute nicht? Beim nächsten Mal dabei"}
              </button>
            )}
          </div>
        );
      })}
      <div style={{ fontSize: 12, color: C.mut, textAlign: "center", padding: "8px 20px 0", lineHeight: 1.5 }}>
        Pläne sind freundschaftlich & offen. Dating läuft über Entdecken — zu zweit oder zu viert.
      </div>
    </div>
  );

  const Entdecken = () => (
    <div style={{ padding: "16px 18px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 19, fontWeight: 600, color: C.ink }}>Dein Set für heute</div>
        <div style={{ fontSize: 12, color: C.coralDeep, fontWeight: 600 }}>{signals} Signale übrig</div>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        <Chip warm active={discCat === "alle"} onClick={() => setDiscCat("alle")}>Alle</Chip>
        {CATS.map((c) => (
          <Chip warm key={c.id} active={discCat === c.id} onClick={() => setDiscCat(c.id)}>{c.label}</Chip>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: C.mut, margin: "4px 2px 12px" }}>
        Sortiert nur — schliesst niemanden aus.
      </div>

      {!deckDone && profile ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, overflow: "hidden" }}>
          {profile.signal && (
            <div style={{ background: C.coralSoft, padding: "11px 16px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Heart size={14} color={C.coralDeep} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: C.coralDeep, lineHeight: 1.4 }}>
                <strong>Hat dir ein Signal geschickt:</strong> «{profile.signal}» — Zurückliken = Match.
              </div>
            </div>
          )}
          <div style={{ height: 260, background: profile.photos[0], display: "flex", alignItems: "flex-end", padding: 16 }}>
            <div style={{
              fontFamily: "'Fraunces', sans-serif", fontSize: 84, fontWeight: 700,
              color: "rgba(25,24,19,0.25)", lineHeight: 0.9,
            }}>{profile.name[0]}</div>
          </div>
          <div style={{ padding: 18, paddingBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Fraunces', sans-serif", fontSize: 22, fontWeight: 600, color: C.ink }}>
              {profile.name}, {profile.age} <BadgeCheck size={18} color={C.green} />
            </div>
            <div style={{ fontSize: 13, color: C.mut, marginTop: 2 }}>Zürich · ganzes Profil — einfach weiterscrollen</div>
            <div style={{ display: "flex", gap: 6, margin: "10px 0", flexWrap: "wrap" }}>
              {profile.cats.map((c) => (
                <span key={c} style={{ fontSize: 12, background: C.greenSoft, color: C.green, padding: "4px 11px", borderRadius: 999, fontWeight: 600 }}>{c}</span>
              ))}
              {profile.rel && (
                <span style={{ fontSize: 12, background: C.paper, color: C.sub, border: `1px solid ${C.line}`, padding: "3px 11px", borderRadius: 999, fontWeight: 600 }}>{profile.rel}</span>
              )}
              <span style={{ fontSize: 12, background: C.coralSoft, color: C.coralDeep, padding: "4px 11px", borderRadius: 999, fontWeight: 600 }}>{profile.shared}</span>
            </div>
            <div style={{ background: C.paper, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, color: C.mut, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase" }}>{profile.q}</div>
              <div style={{ fontSize: 15, color: C.ink, marginTop: 4, lineHeight: 1.4 }}>{profile.a}</div>
            </div>
          </div>
          <div style={{ height: 210, background: profile.photos[1] }} />
          <div style={{ padding: 18 }}>
            <div style={{ background: C.paper, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, color: C.mut, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase" }}>{profile.q2}</div>
              <div style={{ fontSize: 15, color: C.ink, marginTop: 4, lineHeight: 1.4 }}>{profile.a2}</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
              <button onClick={() => skipProfile(profile)} style={{
                flex: 1, padding: "13px 0", borderRadius: 999, border: `1px solid ${C.line}`,
                background: C.card, color: C.sub, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Überspringen</button>
              <button onClick={() => likeProfile(profile)} style={{
                flex: 1, padding: "13px 0", borderRadius: 999, border: "none",
                background: C.coral, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}><Heart size={16} /> Gefällt mir</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: "44px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 20, fontWeight: 600, color: C.ink }}>Das war's für heute.</div>
          <div style={{ fontSize: 14, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
            {discCat !== "alle"
              ? "In dieser Kategorie ist gerade niemand mehr — unter «Alle» warten vielleicht noch Gesichter."
              : "Morgen gibt es ein frisches Set. Bis dahin: Vielleicht wartet draussen ein Plan auf dich."}
          </div>
        </div>
      )}
      <div style={{ fontSize: 12, color: C.mut, textAlign: "center", padding: "14px 20px 0", lineHeight: 1.5 }}>
        Wenige Profile, wenige Signale — dafür zählt jedes. Kein Deck ohne Boden.
      </div>
    </div>
  );

  const KIND_ICON = { gym: Dumbbell, cafe: Coffee, boulder: Mountain };
  const KIND_LABEL = { gym: "Trainingsgesellschaft", cafe: "Kafi-Gesellschaft", boulder: "Klettergesellschaft" };
  const PLACE_DB = [
    { id: "cafe1", name: "Grande Café, Kreis 1", kind: "cafe", count: 3 },
    { id: "boulder1", name: "Minimum Boulder, Kreis 5", kind: "boulder", count: 4 },
    { id: "boulder2", name: "Kletterzentrum Gaswerk, Schlieren", kind: "boulder", count: 2 },
    { id: "cafe2", name: "Café Plüsch, Kreis 4", kind: "cafe", count: 1 },
    { id: "gym2", name: "Aktiv Fitness, Oerlikon", kind: "gym", count: 5 },
  ];
  const addPlace = (pd) => {
    setPlaces([...places, { ...pd, interested: false }]);
    setPlacePicker(false);
    setPlaceQuery("");
    showToast(`${pd.name.split(",")[0]} hinzugefügt — privat, wie immer.`);
  };
  const togglePlace = (id) => {
    const pl = places.find((x) => x.id === id);
    if (pl && !pl.interested) showToast("Gesetzt. Aufgedeckt wird nur beidseitig.");
    setPlaces(places.map((x) => (x.id === id ? { ...x, interested: !x.interested } : x)));
  };

  const Orte = () => (
    <div style={{ padding: "16px 18px 24px" }}>
      <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 19, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Deine Orte · {places.length} von 3</div>
      {places.map((pl) => {
        const PIcon = KIND_ICON[pl.kind];
        return (
          <div key={pl.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PIcon size={20} color={C.green} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{pl.name}</div>
                <div style={{ fontSize: 12, color: C.mut, display: "flex", alignItems: "center", gap: 4 }}>
                  <Lock size={11} /> privat — für niemanden sichtbar
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", padding: 14, background: C.paper, borderRadius: 14 }}>
              <div style={{ display: "flex" }}>
                {["#CDCFC6", "#D8D1C5", "#C7CDD3", "#D5C7CD"].slice(0, Math.min(4, pl.count)).map((col, i) => (
                  <div key={i} style={{
                    width: 30, height: 30, borderRadius: 15, background: col, border: `2px solid ${C.paper}`,
                    marginLeft: i > 0 ? -9 : 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, color: C.sub,
                  }}>?</div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.35 }}>
                <strong>{pl.count} Personen</strong> hier sind offen für {KIND_LABEL[pl.kind]}
              </div>
            </div>
            <button onClick={() => togglePlace(pl.id)} style={{
              width: "100%", padding: "13px 0", borderRadius: 999, border: "none", cursor: "pointer",
              background: pl.interested ? C.greenSoft : C.green, color: pl.interested ? C.green : "#fff",
              fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              {pl.interested ? <><Check size={16} /> Interesse gesetzt — nur bei Gegenseitigkeit sichtbar</> : "Interesse zeigen"}
            </button>
          </div>
        );
      })}

      {places.length < 3 ? (
        <button onClick={() => setPlacePicker(true)} style={{
          width: "100%", padding: "20px 0", borderRadius: 18, cursor: "pointer",
          border: `1.5px dashed ${C.line}`, background: "transparent", color: C.mut, fontSize: 14, fontWeight: 500,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}><Plus size={16} /> Stammcafé oder anderen Ort hinzufügen</button>
      ) : (
        <div style={{ fontSize: 12, color: C.mut, textAlign: "center", padding: "6px 24px 0" }}>
          Maximal 3 Orte — Fokus schlägt Breite.
        </div>
      )}

      <div style={{ fontSize: 12, color: C.mut, textAlign: "center", padding: "16px 24px 0", lineHeight: 1.5 }}>
        Deine Orte sind nie öffentlich. Zwei Personen sehen einander erst, wenn beide Interesse gezeigt haben — symmetrisch oder gar nicht.
      </div>
    </div>
  );

  const Erstellen = () => (
    <div style={{ padding: "16px 18px 24px" }}>
      <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 19, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Wohin gehst du eh?</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>Kein Event, keine Orga. Nur dein Plan — mit offenen Plätzen.</div>
      <input
        value={fText}
        onChange={(e) => setFText(e.target.value)}
        placeholder="Ich geh eh …"
        style={{
          width: "100%", boxSizing: "border-box", padding: "15px 16px", borderRadius: 14,
          border: `1px solid ${C.line}`, background: C.card, fontSize: 16, color: C.ink,
          fontFamily: "'Fraunces', sans-serif", outline: "none",
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, margin: "18px 0 8px", textTransform: "uppercase" }}>Kategorie</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CATS.map((c) => <Chip key={c.id} active={fCat === c.id} onClick={() => setFCat(c.id)}>{c.label}</Chip>)}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, margin: "18px 0 8px", textTransform: "uppercase" }}>Wann</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <Chip active={fFlex === false} onClick={() => { setFFlex(false); setFWhen("Do Abend"); }}>Fix</Chip>
        <Chip active={fFlex === true} onClick={() => { setFFlex(true); setFWhen("Diese Woche"); }}>Flexibel</Chip>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(fFlex
          ? ["Diese Woche", "Wochenende", "Nächste Woche"]
          : ["Do Abend", "Fr Abend", "Sa Vormittag", "So Nachmittag"]
        ).map((w) => (
          <Chip key={w} active={fWhen === w} onClick={() => setFWhen(w)}>{w}</Chip>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.mut, marginTop: 8, lineHeight: 1.45 }}>
        {fFlex
          ? "Mitkommende tippen an, welche Tage bei ihnen gehen — du legst danach den Termin fest. Fenster max. 7 Tage, ein flexibler Plan gleichzeitig."
          : "Du gehst eh — der Termin steht, niemand muss verhandeln."}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, margin: "18px 0 8px", textTransform: "uppercase" }}>Offene Plätze</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => setFSpots(Math.max(1, fSpots - 1))} style={{ width: 38, height: 38, borderRadius: 19, border: `1px solid ${C.line}`, background: C.card, fontSize: 18, color: C.ink, cursor: "pointer" }}>−</button>
        <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 22, fontWeight: 600, color: C.ink, minWidth: 20, textAlign: "center" }}>{fSpots}</div>
        <button onClick={() => setFSpots(Math.min(5, fSpots + 1))} style={{ width: 38, height: 38, borderRadius: 19, border: `1px solid ${C.line}`, background: C.card, fontSize: 18, color: C.ink, cursor: "pointer" }}>+</button>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <Shield size={14} color={C.green} /> Wer sieht diesen Plan?
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <div style={{ fontSize: 12, color: C.mut }}>Alter</div>
          <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 15, fontWeight: 700, color: C.ink }}>
            {fAgeMin} – {fAgeMax === 65 ? "65+" : fAgeMax} Jahre
          </div>
        </div>
        <div style={{ position: "relative", height: 34, marginBottom: 12 }}>
          <div style={{ position: "absolute", top: 15, left: 0, right: 0, height: 4, borderRadius: 2, background: C.line }} />
          <div style={{
            position: "absolute", top: 15, height: 4, borderRadius: 2, background: C.green,
            left: `${((fAgeMin - 18) / 47) * 100}%`,
            right: `${100 - ((fAgeMax - 18) / 47) * 100}%`,
          }} />
          <input
            type="range" className="dr" min={18} max={65} value={fAgeMin}
            onChange={(e) => setFAgeMin(Math.min(Number(e.target.value), fAgeMax - 1))}
            aria-label="Mindestalter"
          />
          <input
            type="range" className="dr" min={18} max={65} value={fAgeMax}
            onChange={(e) => setFAgeMax(Math.max(Number(e.target.value), fAgeMin + 1))}
            aria-label="Höchstalter"
          />
        </div>
        <div style={{ fontSize: 12, color: C.mut, marginBottom: 6 }}>Geschlecht</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["Alle", "Frauen", "Männer"].map((g) => <Chip key={g} active={fGender === g} onClick={() => setFGender(g)}>{g}</Chip>)}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.ink, cursor: "pointer" }}>
          <span onClick={() => setFVerified(!fVerified)} style={{
            width: 40, height: 23, borderRadius: 12, background: fVerified ? C.green : C.line,
            position: "relative", transition: "background .15s", flexShrink: 0,
          }}>
            <span style={{
              position: "absolute", top: 2.5, left: fVerified ? 19 : 3, width: 18, height: 18,
              borderRadius: 9, background: "#fff", transition: "left .15s",
            }} />
          </span>
          Nur verifizierte Profile
        </label>
        <div style={{ fontSize: 12, color: C.mut, marginTop: 12, lineHeight: 1.45 }}>
          Wer nicht passt, sieht deinen Plan gar nie. Gefiltert wird vorher — nicht durch Ablehnung danach.
        </div>
      </div>
      <button onClick={publishPlan} style={{
        width: "100%", marginTop: 18, padding: "15px 0", borderRadius: 999, border: "none",
        background: C.ink, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
      }}>Plan veröffentlichen</button>
    </div>
  );

  const toggleIn = (arr, set, val) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const Profil = () => (
    <div style={{ padding: "16px 18px 24px" }}>
      {/* Kopf */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, textAlign: "center" }}>
        <div style={{ width: 76, height: 76, borderRadius: 38, background: C.greenSoft, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', sans-serif", fontSize: 30, fontWeight: 700, color: C.green }}>D</div>
        <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 20, fontWeight: 600, color: C.ink, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          Du, 28 <BadgeCheck size={17} color={C.green} />
        </div>
        <div style={{ fontSize: 13, color: C.mut }}>Zürich · verifiziert · {langs.map(l => l === "Schweizerdeutsch" ? "CH" : l.slice(0, 2).toUpperCase()).join("/")}</div>
      </div>

      {/* Fotos */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 10 }}>Meine Fotos · {myPhotos.length} von 5</div>
        <div style={{ display: "flex", gap: 8 }}>
          {myPhotos.map((col, i) => (
            <div key={i} onClick={() => showToast("In der echten App: Foto ansehen, ersetzen oder löschen.")} style={{ flex: 1, aspectRatio: "3/4", borderRadius: 12, background: col, display: "flex", alignItems: "flex-end", padding: 5, cursor: "pointer" }}>
              {i === 0 && <span style={{ fontSize: 9, background: "rgba(25,24,19,0.55)", color: "#fff", padding: "2px 6px", borderRadius: 999, fontWeight: 600 }}>Hauptfoto</span>}
            </div>
          ))}
          {Array.from({ length: 5 - myPhotos.length }).map((_, i) => (
            <button key={"e" + i} onClick={() => {
              const pool = ["#DFD3BD", "#C5CAD8", "#CCD0C2", "#D6C4CA"];
              setMyPhotos([...myPhotos, pool[myPhotos.length % pool.length]]);
              showToast("Foto hinzugefügt.");
            }} style={{ flex: 1, aspectRatio: "3/4", borderRadius: 12, border: `1.5px dashed ${C.line}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: C.mut, cursor: "pointer" }}><Plus size={15} /></button>
          ))}
        </div>
      </div>

      {/* Über mich + Prompts */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase" }}>Über mich</div>
          <div style={{ fontSize: 11, color: C.mut }}>96/150</div>
        </div>
        <div style={{ fontSize: 14.5, color: C.ink, lineHeight: 1.45 }}>
          Halb Gym, halb Gipfeli. Immer offen für Pläne, bei denen man danach etwas erzählen kann.
        </div>
        <div style={{ background: C.paper, borderRadius: 14, padding: 14, marginTop: 14 }}>
          <div style={{ fontSize: 11, color: C.mut, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase" }}>Ich geh eh regelmässig… — kommst du mit?</div>
          <div style={{ fontSize: 14.5, color: C.ink, marginTop: 4, lineHeight: 1.4 }}>Dienstag & Donnerstag ins Gym, Sonntag Käfele am See.</div>
        </div>
        <div style={{ background: C.paper, borderRadius: 14, padding: 14, marginTop: 10 }}>
          <div style={{ fontSize: 11, color: C.mut, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase" }}>Ohne Ziel in den nächsten Zug steigen — Traum oder Albtraum?</div>
          <div style={{ fontSize: 14.5, color: C.ink, marginTop: 4, lineHeight: 1.4 }}>Traum. Solange es Zvieri gibt.</div>
        </div>
        {thirdSaved ? (
          <div style={{ background: C.paper, borderRadius: 14, padding: 14, marginTop: 10 }}>
            <div style={{ fontSize: 11, color: C.mut, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase" }}>{thirdQ}</div>
            <div style={{ fontSize: 14.5, color: C.ink, marginTop: 4, lineHeight: 1.4 }}>{thirdA}</div>
            <button onClick={() => { setThirdSaved(false); setThirdQ(null); setThirdA(""); }} style={{ background: "none", border: "none", padding: 0, marginTop: 8, fontSize: 12, fontWeight: 600, color: C.mut, cursor: "pointer" }}>Entfernen</button>
          </div>
        ) : thirdQ ? (
          <div style={{ background: C.paper, borderRadius: 14, padding: 14, marginTop: 10 }}>
            <div style={{ fontSize: 11, color: C.mut, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase" }}>{thirdQ}</div>
            <input
              value={thirdA}
              onChange={(e) => setThirdA(e.target.value.slice(0, 150))}
              placeholder="Deine Antwort …"
              style={{ width: "100%", boxSizing: "border-box", marginTop: 8, padding: "11px 12px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, fontSize: 14.5, color: C.ink, outline: "none" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <button onClick={() => { setThirdQ(null); setThirdA(""); setPickerOpen(true); }} style={{ background: "none", border: "none", padding: 0, fontSize: 12, fontWeight: 600, color: C.mut, cursor: "pointer" }}>Andere Frage</button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: C.mut }}>{thirdA.length}/150</span>
                <button onClick={() => { if (thirdA.trim()) { setThirdSaved(true); showToast("Dritte Antwort gespeichert."); } }} style={{ padding: "8px 16px", borderRadius: 999, border: "none", background: thirdA.trim() ? C.green : C.line, color: "#fff", fontSize: 13, fontWeight: 600, cursor: thirdA.trim() ? "pointer" : "default" }}>Speichern</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setPickerOpen(true)} style={{
            width: "100%", marginTop: 10, padding: "12px 0", borderRadius: 14, cursor: "pointer",
            border: `1.5px dashed ${C.line}`, background: "transparent", color: C.mut, fontSize: 13, fontWeight: 500,
          }}>+ Dritte Antwort hinzufügen (optional)</button>
        )}
      </div>

      {/* Rhythmus */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 8 }}>Meist unterwegs</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Morgens", "Abends", "Wochenende"].map((r) => (
            <Chip key={r} active={rhythm.includes(r)} onClick={() => toggleIn(rhythm, setRhythm, r)}>{r}</Chip>
          ))}
        </div>
      </div>

      {/* Sprachen */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 8 }}>Ich spreche</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Deutsch", "Schweizerdeutsch", "Englisch", "Französisch", "Italienisch"].map((l) => (
            <Chip key={l} active={langs.includes(l)} onClick={() => toggleIn(langs, setLangs, l)}>{l}</Chip>
          ))}
        </div>
        <input
          value={otherLangs}
          onChange={(e) => setOtherLangs(e.target.value)}
          placeholder="Weitere Sprachen … (z. B. Spanisch, Tamil, Portugiesisch)"
          style={{ width: "100%", boxSizing: "border-box", marginTop: 10, padding: "11px 12px", borderRadius: 10, border: `1px solid ${C.line}`, background: C.paper, fontSize: 13.5, color: C.ink, outline: "none" }}
        />
      </div>

      {/* Ort & Umkreis */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 8 }}>Wohnort</div>
        <div style={{ fontSize: 14.5, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={15} color={C.green} /> Zürich
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "14px 0 2px" }}>
          <div style={{ fontSize: 12, color: C.mut }}>Umkreis für Pläne & Entdecken</div>
          <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 15, fontWeight: 700, color: C.ink }}>{radius} km</div>
        </div>
        <div style={{ position: "relative", height: 34 }}>
          <div style={{ position: "absolute", top: 15, left: 0, right: 0, height: 4, borderRadius: 2, background: C.line }} />
          <div style={{ position: "absolute", top: 15, height: 4, borderRadius: 2, background: C.green, left: 0, right: `${100 - ((radius - 1) / 49) * 100}%` }} />
          <input type="range" className="dr" min={1} max={50} value={radius}
            onChange={(e) => setRadius(Number(e.target.value))} aria-label="Umkreis in Kilometern" />
        </div>
        <div style={{ fontSize: 12, color: C.mut, lineHeight: 1.45 }}>
          Sortiert nach Nähe — schliesst niemanden aus. Andere sehen nur deine Stadt, nie deine Adresse oder exakte Distanz.
        </div>
      </div>

      {/* Absicht */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 8 }}>Ich suche</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={seek.freundschaft} onClick={() => setSeek({ ...seek, freundschaft: !seek.freundschaft })}>Freundschaft</Chip>
          <Chip warm active={seek.dating} onClick={() => setSeek({ ...seek, dating: !seek.dating })}>Dating</Chip>
        </div>
        {seek.dating && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.coralDeep, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 8 }}>Ich interessiere mich für</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Frauen", "Männer", "Alle"].map((o) => (
                <Chip warm key={o} active={orient === o} onClick={() => setOrient(o)}>{o}</Chip>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.mut, marginTop: 8, lineHeight: 1.45, display: "flex", alignItems: "flex-start", gap: 6 }}>
              <Lock size={12} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>Steuert nur dein Entdecken-Set — für niemanden sichtbar.</span>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: C.coralDeep, letterSpacing: 0.9, textTransform: "uppercase", margin: "16px 0 8px" }}>Beziehungsmodell · optional</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Single", "Offene Beziehung"].map((r) => (
                <Chip warm key={r} active={relModel === r} onClick={() => setRelModel(relModel === r ? null : r)}>{r}</Chip>
              ))}
            </div>
            <div style={{ fontSize: 12, color: C.mut, marginTop: 8, lineHeight: 1.45 }}>
              Nur wenn du es angibst, erscheint es als kleines Badge auf deinem Profil. Nochmals antippen entfernt es.
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.ink, cursor: "pointer", marginTop: 16 }}>
              <span onClick={() => setShowOpenRel(!showOpenRel)} style={{
                width: 40, height: 23, borderRadius: 12, background: showOpenRel ? C.coral : C.line,
                position: "relative", transition: "background .15s", flexShrink: 0,
              }}>
                <span style={{
                  position: "absolute", top: 2.5, left: showOpenRel ? 19 : 3, width: 18, height: 18,
                  borderRadius: 9, background: "#fff", transition: "left .15s",
                }} />
              </span>
              Leute in offenen Beziehungen anzeigen
            </label>
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", margin: "16px 0 8px" }}>So treffe ich mich gern</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={meet.gruppe} onClick={() => setMeet({ ...meet, gruppe: !meet.gruppe })}>In der Gruppe</Chip>
          <Chip active={meet.einzeln} onClick={() => setMeet({ ...meet, einzeln: !meet.einzeln })}>Zu zweit</Chip>
        </div>
        <div style={{ fontSize: 12, color: C.mut, marginTop: 14, lineHeight: 1.5 }}>
          Diese zwei Einstellungen steuern alles: Du siehst nur, was zu dir passt — und umgekehrt.
        </div>
      </div>

      {/* Kategorien & Orte */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 10 }}>Meine Kategorien</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["Sport", "Kaffee", "Ausgang"].map((c) => (
            <span key={c} style={{ fontSize: 13, background: C.greenSoft, color: C.green, padding: "5px 13px", borderRadius: 999, fontWeight: 600 }}>{c}</span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: C.mut, marginTop: 8, lineHeight: 1.45 }}>
          Kategorien sortieren deinen Feed und dein Set — ausgeschlossen wird dadurch niemand.
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", margin: "16px 0 8px" }}>Meine Orte</div>
        <div style={{ fontSize: 14, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
          Puls Fitness, Kreis 5 <Lock size={12} color={C.mut} />
        </div>
      </div>

      {/* App-Sprache */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 8 }}>App-Sprache</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={uiLang === "DE"} onClick={() => setUiLang("DE")}>Deutsch</Chip>
          <Chip active={uiLang === "EN"} onClick={() => { setUiLang("EN"); showToast("In der echten App wechselt hier alles auf Englisch."); }}>English</Chip>
        </div>
      </div>
    </div>
  );

  // ---------- Match Modal ----------
  const MatchModal = () => {
    if (!match) return null;
    const close = () => { setSeen([...seen, match.profile.id]); setMatch(null); };
    return (
      <div style={{
        position: "absolute", inset: 0, background: "rgba(25,24,19,0.55)", zIndex: 30,
        display: "flex", alignItems: "flex-end",
      }}>
        <div style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", padding: "26px 22px 30px" }}>
          {match.stage === "match" && (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <div style={{ display: "flex" }}>
                  <Avatar color={C.greenSoft} name="D" size={58} />
                  <div style={{ marginLeft: -14, zIndex: 1 }}><Avatar color={match.profile.avatar} name={match.profile.name} size={58} /></div>
                </div>
              </div>
              <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 24, fontWeight: 700, color: C.coralDeep, textAlign: "center" }}>Es passt beidseitig.</div>
              <div style={{ fontSize: 14, color: C.sub, textAlign: "center", marginTop: 6, lineHeight: 1.45 }}>
                {match.profile.name} findet dich auch spannend — und ihr wollt beide bouldern. Wie wollt ihr euch treffen?
              </div>
              <button onClick={() => setMatch({ ...match, stage: "vier" })} style={{
                width: "100%", marginTop: 20, padding: "15px 16px", borderRadius: 16, border: "none",
                background: C.coral, color: "#fff", cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Users size={17} /> Lieber zu viert</div>
                <div style={{ fontSize: 12.5, opacity: 0.92, marginTop: 3 }}>Mit einem zweiten Match-Paar — entspannter, sicherer, kein Interview-Feeling.</div>
              </button>
              <button onClick={() => setMatch({ ...match, stage: "zwei" })} style={{
                width: "100%", marginTop: 10, padding: "15px 16px", borderRadius: 16, cursor: "pointer",
                border: `1px solid ${C.line}`, background: C.card, textAlign: "left",
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}><Heart size={16} color={C.coral} /> Zu zweit</div>
                <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3 }}>Klassisch. Chat öffnet sich — und läuft ab, wenn kein Plan draus wird.</div>
              </button>
            </>
          )}
          {match.stage === "vier" && (
            <>
              <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 21, fontWeight: 700, color: C.ink }}>Euer Vierer-Vorschlag</div>
              <div style={{ fontSize: 14, color: C.sub, marginTop: 4, lineHeight: 1.45 }}>
                Zoé & Levi haben auch gematcht — und wollen diese Woche auch bouldern.
              </div>
              <div style={{ background: C.coralSoft, borderRadius: 16, padding: 16, marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                  <Avatar color={C.greenSoft} name="D" size={44} />
                  <div style={{ marginLeft: -10 }}><Avatar color={match.profile.avatar} name={match.profile.name} size={44} /></div>
                  <div style={{ width: 14 }} />
                  <Avatar color="#DFD3BD" name="Z" size={44} />
                  <div style={{ marginLeft: -10 }}><Avatar color="#C5CAD8" name="L" size={44} /></div>
                </div>
                <div style={{ fontSize: 14, color: C.coralDeep, fontWeight: 600, textAlign: "center" }}>
                  Du & {match.profile.name} · Zoé & Levi
                </div>
                <div style={{ fontSize: 13, color: C.ink, textAlign: "center", marginTop: 4 }}>
                  Bouldern · Donnerstag 19:00 · Kreis 5
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.mut, marginTop: 12, lineHeight: 1.5, textAlign: "center" }}>
                Alle vier bestätigen einzeln. Jede Person kennt ihr Gegenüber — keine Konkurrenz, kein Casting.
              </div>
              <button onClick={() => setMatch({ ...match, stage: "done" })} style={{
                width: "100%", marginTop: 14, padding: "15px 0", borderRadius: 999, border: "none",
                background: C.coral, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>Passt für mich ✓</button>
              <button onClick={() => setMatch({ ...match, stage: "zwei" })} style={{
                width: "100%", marginTop: 8, padding: "12px 0", borderRadius: 999, border: "none",
                background: "transparent", color: C.sub, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}>Doch lieber zu zweit</button>
            </>
          )}
          {match.stage === "zwei" && (
            <>
              <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 21, fontWeight: 700, color: C.ink }}>Chat mit {match.profile.name} geöffnet</div>
              <div style={{ fontSize: 14, color: C.sub, marginTop: 8, lineHeight: 1.5 }}>
                Ein kleiner Twist: Der Chat läuft in <strong style={{ color: C.ink }}>7 Tagen</strong> ab, falls ihr nichts abmacht. Aus Schreiben soll ein Plan werden — nicht umgekehrt.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: 13, background: C.paper, borderRadius: 12, fontSize: 13, color: C.sub }}>
                <Clock size={15} color={C.coral} /> Läuft ab in 6 Tagen, 23 Stunden
              </div>
              <button onClick={() => { setMatches([...matches, { id: "m" + Date.now(), name: match.profile.name, color: match.profile.avatar, days: 7, last: "Neues Match — sag zuerst Hallo!" }]); close(); }} style={{
                width: "100%", marginTop: 16, padding: "14px 0", borderRadius: 999, border: "none",
                background: C.ink, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>Alles klar</button>
            </>
          )}
          {match.stage === "done" && (
            <>
              <div style={{ width: 58, height: 58, borderRadius: 29, background: C.greenSoft, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={26} color={C.green} />
              </div>
              <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 21, fontWeight: 700, color: C.ink, textAlign: "center", marginTop: 12 }}>Du hast bestätigt — 2 von 4</div>
              <div style={{ fontSize: 14, color: C.sub, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
                Sobald Zoé und Levi bestätigen, ist der Donnerstag fix. Wir sagen dir Bescheid.
              </div>
              <button onClick={() => { setMatches([...matches, { id: "m" + Date.now(), name: `Vierer: Du & ${match.profile.name} · Zoé & Levi`, color: match.profile.avatar, days: null, last: "Do 19:00 — wartet auf Zoé & Levi" }]); close(); }} style={{
                width: "100%", marginTop: 18, padding: "14px 0", borderRadius: 999, border: "none",
                background: C.ink, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>Super</button>
            </>
          )}
        </div>
      </div>
    );
  };

  const NAV = [
    { id: "plaene", label: "Pläne", Icon: Home },
    { id: "entdecken", label: "Entdecken", Icon: Compass },
    { id: "erstellen", label: "", Icon: Plus },
    { id: "orte", label: "Orte", Icon: MapPin },
    { id: "profil", label: "Ich", Icon: User },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#EAE7DF", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "28px 12px", fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400;500;600;700&display=swap');
        button:focus-visible, input:focus-visible { outline: 2px solid ${C.green}; outline-offset: 2px; }
        input.dr { position: absolute; top: 0; left: 0; width: 100%; height: 34px; margin: 0; -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; }
        input.dr::-webkit-slider-runnable-track { background: transparent; border: none; height: 34px; }
        input.dr::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; pointer-events: auto; width: 22px; height: 22px; border-radius: 11px; background: #fff; border: 2.5px solid ${C.green}; box-shadow: 0 2px 6px rgba(25,24,19,0.25); cursor: pointer; margin-top: 6px; }
        input.dr::-moz-range-track { background: transparent; border: none; }
        input.dr::-moz-range-thumb { pointer-events: auto; width: 18px; height: 18px; border-radius: 10px; background: #fff; border: 2.5px solid ${C.green}; box-shadow: 0 2px 6px rgba(25,24,19,0.25); cursor: pointer; }
        ::-webkit-scrollbar { width: 0; height: 0; }`}</style>

      <div style={{
        width: 392, maxWidth: "100%", height: 780, background: C.paper, borderRadius: 34,
        border: `1px solid ${C.line}`, boxShadow: "0 30px 70px rgba(25,24,19,0.12)",
        position: "relative", overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontStyle: "italic", fontSize: 27, fontWeight: 500, color: C.ink, letterSpacing: 0.3 }}>
            Ambit
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, background: C.card, border: `1px solid ${C.line}`, padding: "5px 12px", borderRadius: 999 }}>
              Zürich
            </div>
            <button onClick={() => setConnOpen(true)} aria-label="Verbindungen" style={{
              position: "relative", width: 38, height: 38, borderRadius: 19, cursor: "pointer",
              background: C.card, border: `1px solid ${C.line}`, color: C.ink,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageCircle size={18} />
              {connCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4, minWidth: 17, height: 17, borderRadius: 9,
                  background: C.coral, color: "#fff", fontSize: 10.5, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
                }}>{connCount}</span>
              )}
            </button>
          </div>
        </div>
        <div style={{ padding: "0 20px 4px", fontSize: 12.5, color: C.mut, flexShrink: 0 }}>
          Du gehst eh. Nimm jemanden mit.
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "plaene" && Plaene()}
          {tab === "entdecken" && Entdecken()}
          {tab === "erstellen" && Erstellen()}
          {tab === "orte" && Orte()}
          {tab === "profil" && Profil()}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "absolute", bottom: 92, left: 20, right: 20, zIndex: 40,
            background: C.ink, color: "#fff", borderRadius: 14, padding: "12px 16px",
            fontSize: 13.5, fontWeight: 500, textAlign: "center",
          }}>{toast}</div>
        )}

        {MatchModal()}

        {/* Kurzprofil-Ansicht */}
        {viewProfile && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(25,24,19,0.55)", zIndex: 30, display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", overflow: "hidden" }}>
              <div style={{ height: 190, background: viewProfile.color, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: 14 }}>
                <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 64, fontWeight: 700, color: "rgba(25,24,19,0.25)", lineHeight: 0.9 }}>{viewProfile.name[0]}</div>
                <button onClick={() => setViewProfile(null)} aria-label="Schliessen" style={{ background: "rgba(25,24,19,0.45)", border: "none", color: "#fff", borderRadius: 16, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={17} /></button>
              </div>
              <div style={{ padding: "16px 20px 26px" }}>
                <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 21, fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 6 }}>
                  {viewProfile.name}, {viewProfile.age} <BadgeCheck size={17} color={C.green} />
                </div>
                <div style={{ fontSize: 13, color: C.mut, marginTop: 2 }}>{viewProfile.city} · {viewProfile.langs}</div>
                <div style={{ display: "flex", gap: 6, margin: "10px 0", flexWrap: "wrap" }}>
                  {viewProfile.cats.map((c) => (
                    <span key={c} style={{ fontSize: 12, background: C.greenSoft, color: C.green, padding: "4px 11px", borderRadius: 999, fontWeight: 600 }}>{c}</span>
                  ))}
                </div>
                <div style={{ background: C.paper, borderRadius: 14, padding: 14 }}>
                  <div style={{ fontSize: 11, color: C.mut, fontWeight: 600, letterSpacing: 0.9, textTransform: "uppercase" }}>{viewProfile.q}</div>
                  <div style={{ fontSize: 14.5, color: C.ink, marginTop: 4, lineHeight: 1.4 }}>{viewProfile.a}</div>
                </div>
                <div style={{ fontSize: 12, color: C.mut, marginTop: 12, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <Lock size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>Kurzprofil — alle Fotos und Antworten siehst du, sobald ihr einen Plan teilt oder ein Match habt.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fragen-Auswahl für dritten Prompt */}
        {pickerOpen && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(25,24,19,0.55)", zIndex: 30, display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", padding: "22px 20px 26px", maxHeight: "80%", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 19, fontWeight: 700, color: C.ink }}>Wähle deine dritte Frage</div>
                <button onClick={() => setPickerOpen(false)} aria-label="Schliessen" style={{ background: "none", border: "none", color: C.mut, cursor: "pointer", padding: 4 }}><X size={20} /></button>
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>8 von 10 Fragen sind noch frei.</div>
              {PROMPT_QS.filter((q) => !ANSWERED_QS.includes(q)).map((q) => (
                <button key={q} onClick={() => { setThirdQ(q); setPickerOpen(false); }} style={{
                  display: "block", width: "100%", textAlign: "left", cursor: "pointer",
                  background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14,
                  padding: "13px 14px", marginBottom: 8, fontSize: 14, color: C.ink, lineHeight: 1.35,
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* Verbindungen */}
        {connOpen && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(25,24,19,0.55)", zIndex: 30, display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: C.paper, borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "88%", overflowY: "auto", padding: "22px 18px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 21, fontWeight: 700, color: C.ink }}>Verbindungen</div>
                <button onClick={() => setConnOpen(false)} aria-label="Schliessen" style={{ background: "none", border: "none", color: C.mut, cursor: "pointer", padding: 4 }}><X size={20} /></button>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <Chip active={connTab === "plaene"} onClick={() => setConnTab("plaene")}>Pläne · {1 + (joined.p2 ? 1 : 0) + plans.filter((p) => requested[p.id]).length}</Chip>
                <Chip warm active={connTab === "matches"} onClick={() => setConnTab("matches")}>Du gefällst · {incomingSignals.length + matches.length}</Chip>
              </div>

              {connTab === "plaene" && (<>
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>Bowling — dein Plan</div>
                  <div style={{ fontSize: 12.5, color: C.sub }}>Fr · 20:00 · {myTaken} von 4 Plätzen belegt{requests.length > 0 ? ` · ${requests.length} Anfrage${requests.length > 1 ? "n" : ""}` : ""}</div>
                </div>
                <button onClick={() => showToast("Plan-Chat mit Eisbrecher — kommt im MVP.")} style={{ padding: "8px 14px", borderRadius: 999, border: "none", background: C.green, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Plan-Chat</button>
              </div>
              {joined.p2 && (
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>Kafi & Gipfeli — Marco</div>
                    <div style={{ fontSize: 12.5, color: C.sub }}>Sa · 10:00 · du bist dabei ✓</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => showToast("Plan-Chat mit Eisbrecher — kommt im MVP.")} style={{ padding: "8px 12px", borderRadius: 999, border: "none", background: C.green, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Chat</button>
                    <button onClick={() => { setJoined({ ...joined, p2: false }); showToast("Abgesagt — Marco weiss Bescheid, der Platz ist frei."); }} style={{ padding: "8px 12px", borderRadius: 999, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Absagen</button>
                  </div>
                </div>
              )}
              {plans.filter((p) => requested[p.id]).map((p) => (
                <div key={"rq" + p.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, marginBottom: 8 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>«{p.text}»</div>
                  <div style={{ fontSize: 12.5, color: C.mut }}>{p.when} · Anfrage offen — wir sagen dir Bescheid</div>
                </div>
              ))}

              </>)}

              {connTab === "matches" && (<>
              {incomingSignals.map((p) => (
                <div key={"sig" + p.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar color={p.avatar} name={p.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{p.name}, {p.age} <span style={{ color: C.coralDeep }}>· Signal</span></div>
                    <div style={{ fontSize: 12.5, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>«{p.signal}»</div>
                  </div>
                  <button onClick={() => { setConnOpen(false); setDiscCat("alle"); setTab("entdecken"); }} style={{ padding: "8px 14px", borderRadius: 999, border: "none", background: C.coral, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Ansehen</button>
                </div>
              ))}
              {matches.map((m) => (
                <div key={m.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar color={m.color} name={m.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                    <div style={{ fontSize: 12.5, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.last}</div>
                    {m.days != null && (
                      <div style={{ fontSize: 11.5, color: C.coralDeep, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} /> Läuft in {m.days} Tagen ab
                      </div>
                    )}
                  </div>
                  <button onClick={() => showToast("Der 1:1-Chat kommt in Phase 2.")} style={{ padding: "8px 12px", borderRadius: 999, border: "none", background: C.coral, color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Chat</button>
                  <button onClick={() => setMenuFor(m.id)} aria-label="Mehr Optionen" style={{ background: "none", border: "none", color: C.mut, cursor: "pointer", padding: 4, flexShrink: 0 }}><MoreHorizontal size={18} /></button>
                </div>
              ))}
              {incomingSignals.length === 0 && matches.length === 0 && (
                <div style={{ fontSize: 13, color: C.mut, textAlign: "center", padding: "10px 0" }}>Noch keine Matches — dein Tages-Set wartet in Entdecken.</div>
              )}
              <div style={{ fontSize: 12, color: C.mut, textAlign: "center", padding: "8px 20px 0", lineHeight: 1.5 }}>
                Nach einem Treffen landen «Gerne wieder»-Chats ebenfalls hier.
              </div>
              </>)}

              <div style={{ fontSize: 12, color: C.mut, textAlign: "center", padding: "12px 20px 0", lineHeight: 1.5 }}>
                Hier landet alles Laufende: deine Pläne, Anfragen, Signale und Matches.
              </div>
            </div>
          </div>
        )}

        {/* Match-Menü: lösen / blockieren / melden */}
        {menuFor && (
          <div onClick={() => setMenuFor(null)} style={{ position: "absolute", inset: 0, background: "rgba(25,24,19,0.35)", zIndex: 40, display: "flex", alignItems: "flex-end" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", padding: "18px 18px 26px" }}>
              <button onClick={() => { setMatches(matches.filter((m) => m.id !== menuFor)); setMenuFor(null); showToast("Still gelöst — die andere Person wird nicht benachrichtigt."); }} style={{ display: "block", width: "100%", textAlign: "left", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8, fontSize: 14.5, fontWeight: 600, color: C.ink, cursor: "pointer" }}>Verbindung lösen</button>
              <button onClick={() => { setMatches(matches.filter((m) => m.id !== menuFor)); setMenuFor(null); showToast("Blockiert — ihr seht euch nirgends mehr."); }} style={{ display: "block", width: "100%", textAlign: "left", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 14px", marginBottom: 8, fontSize: 14.5, fontWeight: 600, color: C.ink, cursor: "pointer" }}>Blockieren</button>
              <button onClick={() => { setMenuFor(null); showToast("Danke fürs Melden — wir schauen es uns an."); }} style={{ display: "block", width: "100%", textAlign: "left", background: C.coralSoft, border: "none", borderRadius: 12, padding: "13px 14px", marginBottom: 8, fontSize: 14.5, fontWeight: 600, color: C.coralDeep, cursor: "pointer" }}>Melden</button>
              <button onClick={() => setMenuFor(null)} style={{ display: "block", width: "100%", textAlign: "center", background: "none", border: "none", padding: "10px 0 0", fontSize: 14, fontWeight: 600, color: C.mut, cursor: "pointer" }}>Abbrechen</button>
            </div>
          </div>
        )}

        {/* Signal verfassen */}
        {likeFor && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(25,24,19,0.55)", zIndex: 30, display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", padding: "22px 20px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 19, fontWeight: 700, color: C.ink }}>Signal an {likeFor.name}</div>
                <button onClick={() => { setLikeFor(null); setLikeMsg(""); }} aria-label="Schliessen" style={{ background: "none", border: "none", color: C.mut, cursor: "pointer", padding: 4 }}><X size={20} /></button>
              </div>
              <div style={{ fontSize: 13, color: C.sub, margin: "6px 0 12px", lineHeight: 1.45 }}>
                Eine Nachricht dazu verdoppelt deine Chancen — am besten gleich mit Plan.
              </div>
              <input
                value={likeMsg}
                onChange={(e) => setLikeMsg(e.target.value.slice(0, 150))}
                placeholder='z. B. «Ich geh Samstag eh bouldern — komm mit?»'
                style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14.5, color: C.ink, outline: "none" }}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: C.mut, marginTop: 4 }}>{likeMsg.length}/150</div>
              <button onClick={() => sendLike(likeFor, likeMsg)} style={{
                width: "100%", marginTop: 10, padding: "14px 0", borderRadius: 999, border: "none",
                background: C.coral, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}><Heart size={16} /> {likeMsg.trim() ? "Signal mit Nachricht senden" : "Signal ohne Nachricht senden"}</button>
            </div>
          </div>
        )}

        {/* Ort auswählen */}
        {placePicker && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(25,24,19,0.55)", zIndex: 30, display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", padding: "22px 20px 26px", maxHeight: "75%", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Fraunces', sans-serif", fontSize: 19, fontWeight: 700, color: C.ink }}>Ort hinzufügen</div>
                <button onClick={() => { setPlacePicker(false); setPlaceQuery(""); }} aria-label="Schliessen" style={{ background: "none", border: "none", color: C.mut, cursor: "pointer", padding: 4 }}><X size={20} /></button>
              </div>
              <div style={{ fontSize: 13, color: C.sub, margin: "6px 0 12px", lineHeight: 1.45 }}>
                Wähle aus der Liste statt frei zu tippen — so erkennt die App, wenn andere denselben Ort haben.
              </div>
              <input
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Suchen … (z. B. Boulder, Café, Oerlikon)"
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.paper, fontSize: 14.5, color: C.ink, outline: "none", marginBottom: 10 }}
              />
              {PLACE_DB.filter((pd) => !places.some((x) => x.id === pd.id) && pd.name.toLowerCase().includes(placeQuery.toLowerCase())).map((pd) => {
                const PIcon = KIND_ICON[pd.kind];
                return (
                  <button key={pd.id} onClick={() => addPlace(pd)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 12px", marginBottom: 8, cursor: "pointer" }}>
                    <PIcon size={17} color={C.green} />
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, flex: 1 }}>{pd.name}</span>
                    <span style={{ fontSize: 11.5, color: C.mut }}>{pd.count} offen</span>
                  </button>
                );
              })}
              <div style={{ fontSize: 12, color: C.mut, textAlign: "center", padding: "8px 20px 0", lineHeight: 1.5 }}>
                Dein Ort fehlt? In der echten App: vorschlagen — wir nehmen ihn auf.
              </div>
            </div>
          </div>
        )}

        {/* Flexibler Plan: Tage angeben */}
        {reqFor && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(25,24,19,0.55)", zIndex: 30, display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", padding: "22px 20px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 700, color: C.ink }}>Wann geht es bei dir?</div>
                <button onClick={() => { setReqFor(null); setReqDays([]); }} aria-label="Schliessen" style={{ background: "none", border: "none", color: C.mut, cursor: "pointer", padding: 4 }}><X size={20} /></button>
              </div>
              <div style={{ fontSize: 13, color: C.sub, margin: "6px 0 12px", lineHeight: 1.45 }}>
                Tippe die Tage an, die bei dir gehen — den Termin legt der Host danach fest.
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                  <Chip key={d} active={reqDays.includes(d)} onClick={() => toggleIn(reqDays, setReqDays, d)}>{d}</Chip>
                ))}
              </div>
              <button onClick={() => { const id = reqFor; setReqFor(null); requestJoin(id); showToast(reqDays.length ? `Anfrage gesendet — deine Tage: ${reqDays.join(", ")}` : "Anfrage gesendet — du bist flexibel."); setReqDays([]); }} style={{
                width: "100%", marginTop: 16, padding: "14px 0", borderRadius: 999, border: "none",
                background: C.green, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>Anfrage senden</button>
            </div>
          </div>
        )}

        {/* Host legt Termin fest */}
        {dateFor && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(25,24,19,0.55)", zIndex: 30, display: "flex", alignItems: "flex-end" }}>
            <div style={{ background: C.card, borderRadius: "24px 24px 0 0", width: "100%", padding: "22px 20px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 700, color: C.ink }}>Termin festlegen</div>
                <button onClick={() => setDateFor(null)} aria-label="Schliessen" style={{ background: "none", border: "none", color: C.mut, cursor: "pointer", padding: 4 }}><X size={20} /></button>
              </div>
              <div style={{ fontSize: 13, color: C.sub, margin: "6px 0 12px", lineHeight: 1.45 }}>
                So sieht die Verfügbarkeit deiner Mitkommenden aus — du entscheidest, niemand verhandelt.
              </div>
              <div style={{ background: C.paper, borderRadius: 12, padding: 13, fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>
                Lea · Do, Fr<br />Marco · Fr, Sa
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.mut, letterSpacing: 0.9, margin: "16px 0 8px", textTransform: "uppercase" }}>Dein Termin</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {["Do 19:00", "Fr 19:00", "Fr 20:30", "Sa 14:00"].map((d) => (
                  <Chip key={d} onClick={() => {
                    setPlans(plans.map((x) => (x.id === dateFor ? { ...x, when: d, flex: false } : x)));
                    setDateFor(null);
                    showToast(`Termin steht: ${d} — alle Mitkommenden sind informiert.`);
                  }}>{d}</Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <div style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          padding: "10px 8px 16px", background: C.card, borderTop: `1px solid ${C.line}`, flexShrink: 0,
        }}>
          {NAV.map((n) => {
            const active = tab === n.id;
            if (n.id === "erstellen") {
              return (
                <button key={n.id} onClick={() => setTab(n.id)} aria-label="Plan erstellen" style={{
                  width: 50, height: 50, borderRadius: 25, border: "none", cursor: "pointer",
                  background: active ? C.ink : C.green, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", marginTop: -20,
                  boxShadow: "0 6px 16px rgba(51,71,60,0.30)",
                }}><Plus size={24} /></button>
              );
            }
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                background: "none", border: "none", cursor: "pointer", padding: "4px 10px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                color: active ? C.ink : C.mut,
              }}>
                <n.Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
                <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
