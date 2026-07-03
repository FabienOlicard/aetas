import React, { useState, useEffect, useRef } from 'react';
import { Hourglass, CalendarRange, Cake, Sparkles, Share2, Volume2, VolumeX, X, Smartphone, Ticket, Instagram, ExternalLink, Dices, BookOpen, Settings, LogOut, Trash2, RefreshCw, Eye, ListPlus, CalendarDays, Search } from 'lucide-react';
import * as Tone from 'tone';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// CONFIGURATION SUPABASE
// Colle ici les deux valeurs de ton projet Supabase
// (Dashboard > Settings > API : "Project URL" et "anon public key").
// Tant que ces valeurs ne sont pas remplies, l'application fonctionne
// en mode local : connexion admin de secours et lien tournée par défaut.
// ─────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://zwvjriprkhekquqdxknc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmpyaXBya2hla3F1cWR4a25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzgxOTEsImV4cCI6MjA5ODY1NDE5MX0.IUCBjYLF7BW4Wl1U2bf0Yy0Hzk9sft1mqVw8tzWJ0do';
const SUPA_ON = SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.includes('A_REMPLACER');
const supabase = SUPA_ON ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const DEFAULT_TOUR_URL = 'https://www.fabienolicard.fr';
const INSTA_URL = 'https://www.instagram.com/fabienolicard';

// Helpers de dessin pour l'image "story"
const wrapLines = (ctx, text, maxW) => {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
};
const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// ─────────────────────────────────────────────────────────────
// Helpers dates et calculs (portée module : réutilisés partout)
// ─────────────────────────────────────────────────────────────
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const pad = (n) => String(n).padStart(2, '0');
const cap = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);
const fmtInt = (n) => new Intl.NumberFormat('fr-FR').format(n);
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysInMonth = (m, y) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
const isValidDate = (d, m, y) =>
  Number.isInteger(d) && Number.isInteger(m) && Number.isInteger(y) &&
  m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(m, y);

// Signe astrologique (dates usuelles du zodiaque occidental)
const ZODIAC = [
  { name: "Capricorne", sym: "♑", from: [12, 22], to: [1, 19] },
  { name: "Verseau",    sym: "♒", from: [1, 20],  to: [2, 18] },
  { name: "Poissons",   sym: "♓", from: [2, 19],  to: [3, 20] },
  { name: "Bélier",     sym: "♈", from: [3, 21],  to: [4, 19] },
  { name: "Taureau",    sym: "♉", from: [4, 20],  to: [5, 20] },
  { name: "Gémeaux",    sym: "♊", from: [5, 21],  to: [6, 20] },
  { name: "Cancer",     sym: "♋", from: [6, 21],  to: [7, 22] },
  { name: "Lion",       sym: "♌", from: [7, 23],  to: [8, 22] },
  { name: "Vierge",     sym: "♍", from: [8, 23],  to: [9, 22] },
  { name: "Balance",    sym: "♎", from: [9, 23],  to: [10, 22] },
  { name: "Scorpion",   sym: "♏", from: [10, 23], to: [11, 21] },
  { name: "Sagittaire", sym: "♐", from: [11, 22], to: [12, 21] },
];
const zodiacOf = (d, m) => {
  for (const z of ZODIAC) {
    const [fm, fd] = z.from, [tm, td] = z.to;
    if (fm === tm) { if (m === fm && d >= fd && d <= td) return z; }
    else if ((m === fm && d >= fd) || (m === tm && d <= td)) return z;
  }
  return ZODIAC[0];
};

const weekdayFR = (d, m, y) => WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
const todayParts = () => { const t = new Date(); return { d: t.getDate(), m: t.getMonth() + 1, y: t.getFullYear() }; };
const computeAge = (d, m, y) => {
  const t = todayParts();
  let age = t.y - y;
  if (t.m < m || (t.m === m && t.d < d)) age -= 1;
  return age;
};
const daysSince = (d, m, y) => {
  const t = todayParts();
  return Math.floor((Date.UTC(t.y, t.m - 1, t.d) - Date.UTC(y, m - 1, d)) / 86400000);
};
// Prochain anniversaire : gère le 29 février (fêté le 1er mars les années non bissextiles)
const nextBirthday = (d, m) => {
  const t = todayParts();
  const build = (yy) => {
    let dd = d, mm = m, note = '';
    if (d === 29 && m === 2 && !isLeap(yy)) { dd = 1; mm = 3; note = 'le 29 février n\'existant pas cette année'; }
    return { d: dd, m: mm, y: yy, note };
  };
  let cand = build(t.y);
  const todayUTC = Date.UTC(t.y, t.m - 1, t.d);
  let candUTC = Date.UTC(cand.y, cand.m - 1, cand.d);
  if (candUTC < todayUTC) { cand = build(t.y + 1); candUTC = Date.UTC(cand.y, cand.m - 1, cand.d); }
  const inDays = Math.round((candUTC - todayUTC) / 86400000);
  return { ...cand, inDays, weekday: weekdayFR(cand.d, cand.m, cand.y), isToday: inDays === 0 };
};

// Analyse du texte collé dans le back-office (format : JJ/MM - Nom (AAAA), Nom (AAAA))
const parseAdditions = (raw) => {
  const ok = [], errors = [];
  const lines = String(raw || '').split(/\r?\n/);
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const mDate = trimmed.match(/^(\d{1,2})\s*[\/.]\s*(\d{1,2})\s*[-:\u2013\u2014]\s*(.+)$/);
    if (!mDate) { errors.push({ line: idx + 1, text: trimmed, reason: "Format attendu : JJ/MM - Nom (AAAA), Nom (AAAA)" }); return; }
    const d = parseInt(mDate[1], 10), mo = parseInt(mDate[2], 10);
    if (!(mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(mo, 2024))) {
      errors.push({ line: idx + 1, text: trimmed, reason: "Jour ou mois invalide" }); return;
    }
    const people = mDate[3].split(',').map((p) => p.trim()).filter(Boolean);
    if (!people.length) { errors.push({ line: idx + 1, text: trimmed, reason: "Aucun nom trouvé" }); return; }
    // Fusionne "Nom, métier (AAAA)" : un segment sans année suivi d'un segment
    // commençant par une minuscule est un métier, pas une nouvelle personne.
    const merged = [];
    for (let i = 0; i < people.length; i++) {
      const hasYear = /\(\d{3,4}\)\s*$/.test(people[i]);
      const next = people[i + 1];
      if (!hasYear && next && /^[a-zàâäéèêëîïôöùûüç]/.test(next)) {
        merged.push(`${people[i]}, ${next}`);
        i += 1;
      } else merged.push(people[i]);
    }
    for (const p of merged) {
      const mY = p.match(/^(.+?)\s*\((\d{3,4})\)$/);
      const label = (mY ? mY[1] : p).trim();
      const year = mY ? parseInt(mY[2], 10) : null;
      if (!label) { errors.push({ line: idx + 1, text: p, reason: "Nom vide" }); continue; }
      ok.push({ date_key: `${pad(mo)}-${pad(d)}`, label, year, day: d, month: mo });
    }
  });
  return { ok, errors };
};

const AlbertAgeApp = () => {
  // ── Parcours public ──
  const [bd, setBd] = useState({ d: '', m: '', y: '' });        // saisie en cours
  const [birth, setBirth] = useState(null);                     // date validée { d, m, y }
  const [view, setView] = useState(null);                       // 'age' | 'year' | 'day' | 'more'
  const [results, setResults] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [dateErr, setDateErr] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [souvenir, setSouvenir] = useState(null);
  const [toast, setToast] = useState('');
  const [showTour, setShowTour] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [installOS, setInstallOS] = useState('iphone');
  const canvasRef = useRef(null);
  const revealTimer = useRef(null);
  const pendingRef = useRef(null);
  const synthRef = useRef(null);
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // ── Données partagées (Supabase) : lien tournée + ajouts "né comme" ──
  const [tourUrl, setTourUrl] = useState(() => {
    try { return localStorage.getItem('fab_tour_url') || DEFAULT_TOUR_URL; } catch (e) { return DEFAULT_TOUR_URL; }
  });
  const [additions, setAdditions] = useState([]);
  const loadShared = async () => {
    if (!SUPA_ON) return;
    try {
      const { data: st } = await supabase.from('app_settings').select('key,value');
      if (st) { const row = st.find((r) => r.key === 'tour_url'); if (row && row.value) setTourUrl(row.value); }
      const { data: adds } = await supabase.from('birthday_additions').select('id,date_key,label,year').order('date_key');
      if (adds) setAdditions(adds);
    } catch (e) { /* silencieux : l'app reste utilisable */ }
  };
  useEffect(() => { loadShared(); }, []);

  // ─────────────────────────────────────────────────────────────
  // BACK-OFFICE PRIVÉ, route /admin-fabien
  // Connexion via Supabase Auth quand il est configuré.
  // Sinon, repli local (mot de passe lisible dans le code : simple garde-fou).
  // ─────────────────────────────────────────────────────────────
  const FALLBACK_EMAIL = 'fabien.olicard@me.com';
  const FALLBACK_PASS = 'ArThUr351PaRfAit';
  const [isAdminRoute] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.replace(/\/+$/, '').toLowerCase() === '/admin-fabien';
  });
  const [adminAuth, setAdminAuth] = useState(() => {
    if (SUPA_ON) return false;
    try { return sessionStorage.getItem('fab_admin_ok') === '1'; } catch (e) { return false; }
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminErr, setAdminErr] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  useEffect(() => {
    if (!SUPA_ON || !isAdminRoute) return;
    supabase.auth.getSession().then(({ data }) => { if (data && data.session) setAdminAuth(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setAdminAuth(!!session));
    return () => { try { sub.subscription.unsubscribe(); } catch (e) {} };
  }, [isAdminRoute]);
  const submitAdminLogin = async () => {
    setAdminErr('');
    if (SUPA_ON) {
      setAdminBusy(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: adminEmail.trim(), password: adminPass });
        if (error) setAdminErr('Email ou mot de passe incorrect.');
        else setAdminAuth(true);
      } catch (e) { setAdminErr('Connexion impossible. Vérifie ta connexion internet.'); }
      setAdminBusy(false);
    } else {
      const okEmail = adminEmail.trim().toLowerCase() === FALLBACK_EMAIL;
      const okPass = adminPass === FALLBACK_PASS;
      if (okEmail && okPass) {
        setAdminAuth(true);
        try { sessionStorage.setItem('fab_admin_ok', '1'); } catch (e) {}
      } else setAdminErr('Email ou mot de passe incorrect.');
    }
  };
  const adminLogout = async () => {
    if (SUPA_ON) { try { await supabase.auth.signOut(); } catch (e) {} }
    setAdminAuth(false);
    setAdminEmail(''); setAdminPass('');
    try { sessionStorage.removeItem('fab_admin_ok'); } catch (e) {}
  };

  // ── États du back-office ──
  const [admTab, setAdmTab] = useState('ajouts');
  const [pasteText, setPasteText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [admMsg, setAdmMsg] = useState('');
  const [genDate, setGenDate] = useState(null);        // { d, m }
  const [genDateShow, setGenDateShow] = useState(false);
  const [genYear, setGenYear] = useState(null);
  const [genYearShow, setGenYearShow] = useState(false);
  const [genFull, setGenFull] = useState(null);        // { d, m, y }
  const [genFullShow, setGenFullShow] = useState(false);
  const [revYear, setRevYear] = useState(1950);
  const [revMonth, setRevMonth] = useState(1);
  const [revSearch, setRevSearch] = useState('');
  const [tourDraft, setTourDraft] = useState('');
  useEffect(() => { setTourDraft(tourUrl); }, [tourUrl]);

  // ─────────────────────────────────────────────────────────────
  // BASE DE DONNÉES : PAR ÂGE (15 à 76)
  // Enrichie & diversifiée. Faits modernes vérifiés ; classiques bien documentés.
  // ─────────────────────────────────────────────────────────────
  const database = {
    15: [
      { name: "Louis Braille", fact: "avait déjà mis au point son alphabet pour les aveugles", year: "1824" },
      { name: "Élisabeth Vigée Le Brun", fact: "réalisa son premier portrait professionnel (future peintre de Marie-Antoinette)", year: "" },
      { name: "Nadia Comăneci", fact: "obtint le premier 10 parfait de l'histoire de la gymnastique olympique", year: "1976" },
      { name: "Mozart", fact: "composait déjà des symphonies et était reconnu dans toute l'Europe", year: "v. 1771" }
    ],
    16: [
      { name: "Jeanne d'Arc", fact: "quitta Domrémy pour convaincre le Dauphin de lui confier une armée", year: "" },
      { name: "Molière", fact: "terminait ses études au Collège de Clermont et rencontrait la famille Béjart", year: "1638" },
      { name: "Albert Einstein", fact: "tenta une première fois (sans succès) l'examen d'entrée de l'École Polytechnique de Zurich", year: "1895" },
      { name: "Blaise Pascal", fact: "rédigea son 'Essai pour les coniques', un traité de géométrie qui stupéfia les savants", year: "1640" }
    ],
    17: [
      { name: "Jeanne d'Arc", fact: "libéra Orléans du siège anglais et conduisit Charles VII au sacre à Reims", year: "1429" },
      { name: "Arthur Rimbaud", fact: "écrivit 'Le Bateau ivre', l'un de ses poèmes les plus célèbres", year: "1871" },
      { name: "Albert Einstein", fact: "fut admis à l'École Polytechnique de Zurich après une année d'études à Aarau", year: "1896" },
      { name: "Pelé", fact: "devint champion du monde de football, plus jeune buteur d'une finale de Coupe du monde", year: "1958" }
    ],
    18: [
      { name: "Victor Hugo", fact: "reçut une pension royale de Louis XVIII pour ses premiers poèmes", year: "1820" },
      { name: "Mary Shelley", fact: "commença à écrire 'Frankenstein' lors d'un été pluvieux au bord du lac Léman", year: "1816" },
      { name: "Simone de Beauvoir", fact: "obtint son baccalauréat et entama des études de philosophie", year: "1926" },
      { name: "Frida Kahlo", fact: "fut victime d'un grave accident de bus qui marqua son corps et toute son œuvre", year: "1925" }
    ],
    19: [
      { name: "Cléopâtre", fact: "devint reine d'Égypte aux côtés de son frère Ptolémée XIII", year: "51 av. J.-C." },
      { name: "Jeanne d'Arc", fact: "fut brûlée vive à Rouen le 30 mai", year: "1431" },
      { name: "Mark Zuckerberg", fact: "lança Facebook depuis sa chambre d'étudiant à Harvard", year: "2004" },
      { name: "Joséphine Baker", fact: "triompha à Paris dans la 'Revue Nègre' et devint une star du music-hall", year: "1925" }
    ],
    20: [
      { name: "Alexandre le Grand", fact: "devint roi de Macédoine après l'assassinat de son père Philippe II", year: "336 av. J.-C." },
      { name: "Pablo Picasso", fact: "entra dans sa 'période bleue' après la mort de son ami Casagemas", year: "1901" },
      { name: "Charles de Gaulle", fact: "sortait de Saint-Cyr et débutait sa carrière militaire", year: "1910" },
      { name: "Évariste Galois", fact: "mourut en duel, laissant des notes qui fondèrent la théorie des groupes en mathématiques", year: "1832" }
    ],
    21: [
      { name: "Alexandre le Grand", fact: "avait déjà écrasé la révolte de Thèbes et s'apprêtait à envahir l'Asie", year: "" },
      { name: "Tiger Woods", fact: "remporta le Masters, son premier tournoi majeur de golf", year: "1997" },
      { name: "Albert Einstein", fact: "obtint son diplôme de l'École Polytechnique de Zurich", year: "1900" },
      { name: "Usain Bolt", fact: "remporta 3 médailles d'or et battit 3 records du monde aux Jeux de Pékin", year: "2008" }
    ],
    22: [
      { name: "Alexandre le Grand", fact: "remporta la bataille du Granique et commença la conquête de l'empire perse", year: "334 av. J.-C." },
      { name: "Steve Jobs", fact: "lança l'Apple II, l'un des premiers ordinateurs personnels grand public", year: "1977" },
      { name: "Victor Hugo", fact: "publia ses 'Nouvelles Odes' et épousa Adèle Foucher", year: "1824" }
    ],
    23: [
      { name: "Alexandre le Grand", fact: "vainquit Darius III à la bataille d'Issos", year: "333 av. J.-C." },
      { name: "Louis Pasteur", fact: "fut reçu à l'École normale supérieure", year: "1845" },
      { name: "Albert Einstein", fact: "entra au Bureau des brevets de Berne, où il mûrira la relativité", year: "1902" }
    ],
    24: [
      { name: "Alexandre le Grand", fact: "conquit l'Égypte et fonda la ville d'Alexandrie", year: "331 av. J.-C." },
      { name: "Napoléon Bonaparte", fact: "fut promu général après le siège de Toulon", year: "1793" },
      { name: "Mozart", fact: "créa 'Idoménée', son premier grand opéra", year: "1781" }
    ],
    25: [
      { name: "Alexandre le Grand", fact: "remporta la bataille de Gaugamèles qui lui livra tout l'empire perse", year: "331 av. J.-C." },
      { name: "Élisabeth Vigée Le Brun", fact: "entra à l'Académie royale et devint la peintre attitrée de Marie-Antoinette", year: "1780" },
      { name: "Charles Lindbergh", fact: "réussit la première traversée en solitaire de l'Atlantique, de New York à Paris", year: "1927" },
      { name: "Johannes Brahms", fact: "composa son premier Concerto pour piano", year: "1858" }
    ],
    26: [
      { name: "Napoléon Bonaparte", fact: "prit la tête de l'armée d'Italie et enchaîna les victoires", year: "1796" },
      { name: "Albert Einstein", fact: "publia ses articles révolutionnaires dont la relativité restreinte (son 'année miracle')", year: "1905" },
      { name: "Pablo Picasso", fact: "peignit 'Les Demoiselles d'Avignon', acte de naissance du cubisme", year: "1907" },
      { name: "Molière", fact: "fonda 'L'Illustre Théâtre' avec Madeleine Béjart", year: "1643" }
    ],
    27: [
      { name: "Napoléon", fact: "signa le traité de Campo-Formio après avoir conquis l'Italie du Nord", year: "1797" },
      { name: "Coco Chanel", fact: "ouvrit sa première boutique, début de son empire de la mode", year: "1910" },
      { name: "Ada Lovelace", fact: "publia le premier algorithme destiné à une machine, devenant la première programmeuse", year: "1843" },
      { name: "Vincent Van Gogh", fact: "renonça à la prédication pour se consacrer au dessin et à la peinture", year: "1880" }
    ],
    28: [
      { name: "Alexandre le Grand", fact: "atteignit la vallée de l'Indus et affronta le roi Pôros", year: "326 av. J.-C." },
      { name: "Marie Curie", fact: "épousa Pierre Curie et débuta ses recherches sur la radioactivité", year: "1895" },
      { name: "Napoléon", fact: "lança la campagne d'Égypte et remporta la bataille des Pyramides", year: "1798" }
    ],
    29: [
      { name: "Victor Hugo", fact: "publia 'Notre-Dame de Paris', succès qui sauva la cathédrale de la démolition", year: "1831" },
      { name: "Michel-Ange", fact: "acheva sa statue du 'David', symbole de la Renaissance florentine", year: "1504" },
      { name: "Mozart", fact: "composa six quatuors dédiés à Haydn, au sommet de sa gloire viennoise", year: "1785" },
      { name: "Napoléon", fact: "menait la campagne d'Égypte avec ses savants (découverte de la pierre de Rosette)", year: "1799" }
    ],
    30: [
      { name: "Napoléon Bonaparte", fact: "réalisa le coup d'État du 18 Brumaire et devint Premier Consul", year: "1799" },
      { name: "Marie Curie", fact: "découvrit le radium et le polonium dans son laboratoire parisien", year: "1898" },
      { name: "Mozart", fact: "créa l'opéra 'Les Noces de Figaro'", year: "1786" },
      { name: "Alexandre le Grand", fact: "régnait déjà sur le plus vaste empire jamais constitué, de la Grèce à l'Inde", year: "" }
    ],
    31: [
      { name: "Napoléon", fact: "franchit le col du Grand-Saint-Bernard et l'emporta à Marengo", year: "1800" },
      { name: "J.K. Rowling", fact: "publia le premier 'Harry Potter', après avoir été refusée par une douzaine d'éditeurs", year: "1997" },
      { name: "Charlie Chaplin", fact: "réalisa 'Le Kid', mêlant pour la première fois rire et émotion", year: "1921" },
      { name: "Galilée", fact: "enseignait les mathématiques à l'université de Padoue", year: "1595" }
    ],
    32: [
      { name: "Alexandre le Grand", fact: "mourut à Babylone, laissant le plus grand empire de l'Antiquité", year: "323 av. J.-C." },
      { name: "Napoléon", fact: "fut proclamé Consul à vie", year: "1802" },
      { name: "Édith Piaf", fact: "rencontra le boxeur Marcel Cerdan, le grand amour de sa vie", year: "1947" }
    ],
    33: [
      { name: "Catherine la Grande", fact: "s'empara du trône et devint impératrice de Russie", year: "1762" },
      { name: "Louis Pasteur", fact: "devint doyen de la faculté des sciences de Lille", year: "1855" },
      { name: "Marie Curie", fact: "poursuivait ses travaux sur le radium et enseignait à Sèvres", year: "1900" }
    ],
    34: [
      { name: "Martin Luther King", fact: "prononça son discours 'I have a dream' devant 250 000 personnes à Washington", year: "1963" },
      { name: "Amelia Earhart", fact: "devint la première femme à traverser l'Atlantique en solitaire", year: "1932" },
      { name: "Mozart", fact: "composa 'Così fan tutte' et travaillait à 'La Flûte enchantée'", year: "1790" },
      { name: "Gustave Eiffel", fact: "réalisa son premier grand pont métallique", year: "1866" }
    ],
    35: [
      { name: "Mozart", fact: "mourut à Vienne, laissant son Requiem inachevé", year: "1791" },
      { name: "Napoléon Bonaparte", fact: "se couronna empereur des Français à Notre-Dame de Paris", year: "1804" },
      { name: "Vincent Van Gogh", fact: "peignit ses 'Tournesols' lors de son séjour à Arles", year: "1888" },
      { name: "Léonard de Vinci", fact: "travaillait à Milan au service de Ludovic Sforza", year: "v. 1487" }
    ],
    36: [
      { name: "Napoléon", fact: "remporta ses plus belles victoires : Ulm puis Austerlitz", year: "1805" },
      { name: "Albert Einstein", fact: "publia la relativité générale, qui révolutionna notre vision de l'univers", year: "1915" },
      { name: "Gustave Flaubert", fact: "publia 'Madame Bovary' et fut poursuivi pour outrage aux mœurs", year: "1857" },
      { name: "Walt Disney", fact: "sortit 'Blanche-Neige', premier long-métrage d'animation de l'histoire", year: "1937" }
    ],
    37: [
      { name: "Napoléon", fact: "écrasa la Prusse à Iéna et instaura le Blocus continental", year: "1806" },
      { name: "Michel-Ange", fact: "acheva la fresque monumentale du plafond de la chapelle Sixtine", year: "1512" },
      { name: "Molière", fact: "triompha avec 'Les Précieuses ridicules' devant le roi", year: "1659" },
      { name: "Raphaël", fact: "mourut à Rome au sommet de son art, le jour de ses 37 ans", year: "1520" }
    ],
    38: [
      { name: "Victor Hugo", fact: "fut élu à l'Académie française", year: "1841" },
      { name: "Louis Pasteur", fact: "réfuta la théorie de la génération spontanée", year: "1860" },
      { name: "Coco Chanel", fact: "lança le parfum N°5, qui deviendra une légende", year: "1921" }
    ],
    39: [
      { name: "Marie Curie", fact: "devint la première femme professeure à la Sorbonne, après la mort de Pierre", year: "1906" },
      { name: "Antoine de Saint-Exupéry", fact: "publia 'Terre des hommes', récit de ses vols pionniers", year: "1939" },
      { name: "Molière", fact: "créa 'L'École des maris'", year: "1661" }
    ],
    40: [
      { name: "Victor Hugo", fact: "perdit sa fille Léopoldine, drame qui inspirera 'Les Contemplations'", year: "1843" },
      { name: "Napoléon", fact: "se sépara de Joséphine et remporta la victoire de Wagram", year: "1809" },
      { name: "Léonard de Vinci", fact: "étudiait l'anatomie et l'ingénierie au service de Ludovic Sforza", year: "v. 1492" }
    ],
    41: [
      { name: "Simone de Beauvoir", fact: "publia 'Le Deuxième Sexe', œuvre fondatrice du féminisme moderne", year: "1949" },
      { name: "Molière", fact: "créa 'L'École des femmes' et épousa Armande Béjart", year: "1663" },
      { name: "Napoléon", fact: "épousa Marie-Louise d'Autriche", year: "1810" }
    ],
    42: [
      { name: "Christophe Colomb", fact: "revenait de son premier voyage vers les Amériques", year: "1493" },
      { name: "Albert Einstein", fact: "reçut le prix Nobel de physique pour l'effet photoélectrique", year: "1921" },
      { name: "Rosa Parks", fact: "refusa de céder sa place dans un bus, étincelle du mouvement des droits civiques", year: "1955" }
    ],
    43: [
      { name: "Napoléon", fact: "lança la désastreuse campagne de Russie", year: "1812" },
      { name: "Alexandre Dumas", fact: "publia 'Le Comte de Monte-Cristo'", year: "1845" },
      { name: "Léonard de Vinci", fact: "commença à peindre 'La Cène' à Milan", year: "v. 1495" },
      { name: "Gustave Eiffel", fact: "construisit le pont Maria Pia à Porto", year: "1877" }
    ],
    44: [
      { name: "Marie Curie", fact: "reçut un second prix Nobel (de chimie), exploit scientifique inégalé", year: "1911" },
      { name: "Louis Pasteur", fact: "mit au point la pasteurisation", year: "1865" },
      { name: "Jules Verne", fact: "publia 'Le Tour du monde en quatre-vingts jours'", year: "1872" }
    ],
    45: [
      { name: "Napoléon", fact: "abdiqua une première fois et fut exilé à l'île d'Elbe", year: "1814" },
      { name: "Galilée", fact: "pointa sa lunette vers le ciel et découvrit les lunes de Jupiter", year: "1610" },
      { name: "Molière", fact: "créa 'Tartuffe', d'abord interdite puis triomphale", year: "1667" }
    ],
    46: [
      { name: "Napoléon Bonaparte", fact: "revint pour les Cent-Jours, perdit à Waterloo et fut exilé à Sainte-Hélène", year: "1815" },
      { name: "Jules Verne", fact: "publia 'L'Île mystérieuse'", year: "1874" },
      { name: "Molière", fact: "créa 'L'Avare'", year: "1668" }
    ],
    47: [
      { name: "Simone Veil", fact: "défendit à l'Assemblée la loi dépénalisant l'avortement, sous les huées", year: "1974" },
      { name: "Victor Hugo", fact: "prononça son grand discours contre la misère à l'Assemblée", year: "1849" },
      { name: "Charles de Gaulle", fact: "publia 'La France et son armée'", year: "1938" }
    ],
    48: [
      { name: "Honoré de Balzac", fact: "poursuivait son immense fresque, 'La Comédie humaine'", year: "v. 1847" },
      { name: "Édith Piaf", fact: "mourut à Grasse, le même jour que son ami Jean Cocteau", year: "1963" },
      { name: "Léon Tolstoï", fact: "publiait 'Anna Karénine' en feuilleton", year: "v. 1876" }
    ],
    49: [
      { name: "Victor Hugo", fact: "s'exila après le coup d'État du 2 décembre", year: "1851" },
      { name: "Christophe Colomb", fact: "fut arrêté et ramené enchaîné en Espagne, tombé en disgrâce", year: "1500" },
      { name: "Jules Verne", fact: "publia 'Les Indes noires'", year: "1877" }
    ],
    50: [
      { name: "Charles Darwin", fact: "publia 'L'Origine des espèces', qui bouleversa la science", year: "1859" },
      { name: "Victor Hugo", fact: "écrivait 'Napoléon le Petit' depuis son exil", year: "1852" },
      { name: "Louis Pasteur", fact: "étudiait les maladies du vin et de la bière", year: "1872" }
    ],
    51: [
      { name: "Steve Jobs", fact: "présenta le tout premier iPhone, qui changea le monde mobile", year: "2007" },
      { name: "Léonard de Vinci", fact: "commença à peindre 'La Joconde'", year: "v. 1503" },
      { name: "Napoléon Bonaparte", fact: "mourut en exil sur l'île de Sainte-Hélène", year: "1821" },
      { name: "Victor Hugo", fact: "écrivait 'Les Châtiments' depuis son exil", year: "1853" }
    ],
    52: [
      { name: "Christophe Colomb", fact: "entreprit son quatrième et dernier voyage vers les Amériques", year: "1502" },
      { name: "Galilée", fact: "fut sommé une première fois par l'Inquisition de renoncer à Copernic", year: "1616" },
      { name: "Victor Hugo", fact: "poursuivait son combat contre Napoléon III depuis l'exil", year: "1854" }
    ],
    53: [
      { name: "Beethoven", fact: "créa sa 9e Symphonie et son 'Hymne à la joie', alors qu'il était devenu sourd", year: "1824" },
      { name: "Walt Disney", fact: "ouvrit Disneyland, premier parc de ce type au monde", year: "1955" },
      { name: "Gustave Eiffel", fact: "lança la construction de sa Tour pour l'Exposition universelle", year: "1887" }
    ],
    54: [
      { name: "Albert Einstein", fact: "émigra aux États-Unis pour fuir le nazisme et rejoignit Princeton", year: "1933" },
      { name: "Christophe Colomb", fact: "mourut, oublié, sans jamais savoir qu'il avait atteint un nouveau continent", year: "1506" },
      { name: "Louis Pasteur", fact: "étudiait la maladie du charbon chez les moutons", year: "1876" }
    ],
    55: [
      { name: "Claude Monet", fact: "exposa sa célèbre série de la cathédrale de Rouen", year: "1894" },
      { name: "Léonard de Vinci", fact: "était au service du roi de France Louis XII, à Milan", year: "1507" },
      { name: "Victor Hugo", fact: "commença sa vaste épopée 'La Légende des siècles'", year: "1857" }
    ],
    56: [
      { name: "Pablo Picasso", fact: "peignit 'Guernica' pour dénoncer le bombardement de la ville basque", year: "1937" },
      { name: "Margaret Thatcher", fact: "dirigea le Royaume-Uni pendant la guerre des Malouines", year: "1982" },
      { name: "Gustave Eiffel", fact: "voyait sa Tour s'élever dans le ciel de Paris", year: "1888" }
    ],
    57: [
      { name: "Miguel de Cervantes", fact: "publia 'Don Quichotte', considéré comme le premier roman moderne", year: "1605" },
      { name: "Gustave Eiffel", fact: "inaugura sa Tour de 300 mètres pour l'Exposition universelle", year: "1889" },
      { name: "Louis Pasteur", fact: "posa le principe de la vaccination", year: "1879" }
    ],
    58: [
      { name: "Auguste Rodin", fact: "présenta son 'Balzac', sculpture qui fit scandale", year: "1898" },
      { name: "Charles de Gaulle", fact: "fonda le Rassemblement du peuple français (RPF)", year: "1948" },
      { name: "Victor Hugo", fact: "travaillait à 'Les Misérables' depuis son exil", year: "v. 1860" }
    ],
    59: [
      { name: "Louis Pasteur", fact: "réussit la première vaccination contre le charbon devant la presse", year: "1881" },
      { name: "Galilée", fact: "publia 'L'Essayeur', véritable manifeste de la méthode scientifique moderne", year: "1623" },
      { name: "Victor Hugo", fact: "achevait 'Les Misérables'", year: "1861" }
    ],
    60: [
      { name: "Mahatma Gandhi", fact: "mena la Marche du sel contre l'impôt colonial britannique", year: "1930" },
      { name: "Victor Hugo", fact: "publia 'Les Misérables', immense succès mondial", year: "1862" },
      { name: "Claude Monet", fact: "entama sa grande série des Nymphéas à Giverny", year: "v. 1900" }
    ],
    61: [
      { name: "Albert Einstein", fact: "devint citoyen américain tout en poursuivant ses recherches à Princeton", year: "1940" },
      { name: "Léonard de Vinci", fact: "peignait 'Saint Jean-Baptiste', l'une de ses dernières œuvres", year: "v. 1513" },
      { name: "Louis Pasteur", fact: "mettait au point son vaccin contre la rage", year: "v. 1884" }
    ],
    62: [
      { name: "Charles Darwin", fact: "publia 'La Filiation de l'homme', appliquant l'évolution à notre espèce", year: "1871" },
      { name: "Léonard de Vinci", fact: "travaillait à Rome au service de la famille Médicis", year: "v. 1514" },
      { name: "Jean de La Fontaine", fact: "fut élu à l'Académie française, consacrant l'auteur des 'Fables'", year: "1684" }
    ],
    63: [
      { name: "Louis Pasteur", fact: "sauva le jeune Joseph Meister grâce au vaccin contre la rage", year: "1885" },
      { name: "Charles de Gaulle", fact: "rédigeait ses 'Mémoires de guerre'", year: "1953" },
      { name: "Rembrandt", fact: "mourut à Amsterdam, ruiné, laissant l'une des œuvres peintes les plus puissantes de l'histoire", year: "1669" }
    ],
    64: [
      { name: "Victor Hugo", fact: "publia 'Les Travailleurs de la mer'", year: "1866" },
      { name: "Léonard de Vinci", fact: "s'installa au château du Clos Lucé, en France, invité par François Ier", year: "1516" },
      { name: "Jean-Sébastien Bach", fact: "composait 'L'Art de la fugue', somme savante de tout son génie", year: "v. 1749" }
    ],
    65: [
      { name: "Winston Churchill", fact: "devint Premier ministre et tint tête à l'Allemagne nazie", year: "1940" },
      { name: "Jean-Sébastien Bach", fact: "mourut à Leipzig, laissant une œuvre musicale immense", year: "1750" },
      { name: "Victor Hugo", fact: "poursuivait 'La Légende des siècles' en exil", year: "v. 1867" }
    ],
    66: [
      { name: "Marie Curie", fact: "mourut, emportée par les radiations dont elle avait percé les secrets", year: "1934" },
      { name: "Claude Monet", fact: "peignait ses Nymphéas malgré une vue qui déclinait", year: "v. 1906" },
      { name: "Victor Hugo", fact: "perdit sa femme Adèle", year: "1868" }
    ],
    67: [
      { name: "Léonard de Vinci", fact: "mourut au Clos Lucé, en France, le 2 mai", year: "1519" },
      { name: "Catherine la Grande", fact: "mourut après 34 ans de règne, ayant fait de la Russie une grande puissance européenne", year: "1796" },
      { name: "Charles de Gaulle", fact: "fut rappelé au pouvoir lors de la crise de mai 1958", year: "1958" }
    ],
    68: [
      { name: "Galilée", fact: "publia son 'Dialogue sur les deux grands systèmes du monde'", year: "1632" },
      { name: "Charles de Gaulle", fact: "fonda la Ve République", year: "1958" },
      { name: "Victor Hugo", fact: "rentra triomphalement à Paris après la chute de Napoléon III", year: "1870" }
    ],
    69: [
      { name: "Galilée", fact: "fut condamné par l'Inquisition et contraint d'abjurer ses découvertes", year: "1633" },
      { name: "Charles de Gaulle", fact: "devint président de la République française", year: "1959" },
      { name: "Victor Hugo", fact: "fut élu député de Paris", year: "1871" }
    ],
    70: [
      { name: "Benjamin Franklin", fact: "signa la Déclaration d'indépendance des États-Unis", year: "1776" },
      { name: "Hokusai", fact: "réalisa 'La Grande Vague de Kanagawa', estampe devenue mondialement célèbre", year: "v. 1831" },
      { name: "Louis Pasteur", fact: "fut célébré lors d'un jubilé national à la Sorbonne", year: "1892" }
    ],
    71: [
      { name: "Nelson Mandela", fact: "fut libéré après 27 ans de prison sous l'apartheid", year: "1990" },
      { name: "Michel-Ange", fact: "fut nommé architecte en chef de la basilique Saint-Pierre de Rome", year: "1546" },
      { name: "Victor Hugo", fact: "publia 'Quatre-vingt-treize', son dernier grand roman", year: "1874" }
    ],
    72: [
      { name: "Galilée", fact: "rédigea, en résidence surveillée, son dernier grand ouvrage de physique", year: "v. 1636" },
      { name: "Claude Monet", fact: "peignait toujours, malgré une cataracte qui voilait ses couleurs", year: "v. 1912" },
      { name: "Benjamin Franklin", fact: "négocia à Paris l'alliance avec la France, décisive pour l'indépendance américaine", year: "1778" }
    ],
    73: [
      { name: "Konrad Adenauer", fact: "devint le premier chancelier de la République fédérale d'Allemagne", year: "1949" },
      { name: "Louis Pasteur", fact: "mourut près de Paris, couvert d'honneurs", year: "1895" },
      { name: "Victor Hugo", fact: "fut élu sénateur de la Seine", year: "1876" }
    ],
    74: [
      { name: "Claude Monet", fact: "se lança dans les immenses panneaux de Nymphéas destinés à l'Orangerie", year: "v. 1914" },
      { name: "Charles de Gaulle", fact: "inaugura le tunnel du Mont-Blanc", year: "1965" },
      { name: "Victor Hugo", fact: "siégeait au Sénat et restait une conscience de la République", year: "1876" }
    ],
    75: [
      { name: "Nelson Mandela", fact: "devint le premier président noir d'Afrique du Sud, élu démocratiquement", year: "1994" },
      { name: "Charles de Gaulle", fact: "fut réélu président de la République face à François Mitterrand", year: "1965" },
      { name: "Konrad Adenauer", fact: "dirigeait, comme chancelier, la reconstruction de l'Allemagne d'après-guerre", year: "v. 1951" }
    ],
    76: [
      { name: "Albert Einstein", fact: "s'éteignit à Princeton, célébré comme le plus grand physicien de son siècle", year: "1955" },
      { name: "Claude Monet", fact: "peignait les grands panneaux de Nymphéas offerts à la France", year: "v. 1916" },
      { name: "Michel-Ange", fact: "dirigeait encore le chantier de la basilique Saint-Pierre de Rome", year: "v. 1551" }
    ]
  };

  // ─────────────────────────────────────────────────────────────
  // CETTE ANNÉE-LÀ : ÉVÉNEMENTS PAR ANNÉE DE NAISSANCE (1950 à 2025)
  // Format : { année: [ { t: titre, s: texte court (app), b: brief (révision) } ] }
  // ─────────────────────────────────────────────────────────────
  const yearEvents = {
    1950: [
      { t: "Début de la guerre de Corée",
        s: "Le 25 juin, la Corée du Nord envahit la Corée du Sud. C'est le premier grand conflit armé de la guerre froide.",
        b: "Le 25 juin 1950, les troupes nord-coréennes franchissent le 38e parallèle et envahissent la Corée du Sud. L'ONU, poussée par les États-Unis, envoie une coalition internationale dirigée par le général MacArthur, tandis que la Chine soutient le Nord. Le conflit fait rage pendant trois ans, cause plusieurs millions de morts et se termine en 1953 par un armistice, sans traité de paix. La péninsule reste coupée en deux le long d'une frontière ultra militarisée. Cette guerre marque la première confrontation armée majeure de la guerre froide et fige une division qui existe encore aujourd'hui." },
      { t: "Sortie de « Cendrillon » de Disney",
        s: "Le studio Disney, au bord de la faillite, sort « Cendrillon ». Le triomphe du film sauve l'entreprise.",
        b: "En 1950, Walt Disney joue son va-tout. Après des années difficiles liées à la guerre, le studio est lourdement endetté et mise presque tout sur un long métrage : « Cendrillon ». Le pari est gagné, le film est un immense succès mondial, il relance la machine Disney et finance les projets suivants, dont Disneyland. La pantoufle de verre, la citrouille transformée en carrosse et la chanson « Bibbidi-Bobbidi-Boo » entrent dans la culture populaire. « Cendrillon » devient l'un des dessins animés les plus emblématiques de l'histoire, redécouvert par chaque génération d'enfants depuis 75 ans." },
      { t: "Le Tour de France arrive à la télévision",
        s: "Les premières images télévisées du Tour de France sont diffusées. Le sport entre dans une nouvelle ère médiatique.",
        b: "En 1950, la télévision française, encore balbutiante avec quelques milliers de récepteurs, commence à diffuser des images du Tour de France. Ce sont d'abord des résumés filmés, projetés le soir, avant l'arrivée des directs dans les années suivantes. C'est une petite révolution : l'épreuve créée en 1903, jusque-là vécue par la radio et les journaux, devient un spectacle visuel national. Le public découvre les visages des coureurs, les cols, les échappées. Le Tour deviendra l'un des programmes les plus regardés de l'été et l'un des événements sportifs les plus télévisés au monde." }
    ],
    1951: [
      { t: "Invention du magnétoscope",
        s: "Les premiers enregistrements d'images sur bande magnétique sont réalisés. L'idée d'enregistrer la télévision devient réalité.",
        b: "En 1951, une équipe américaine financée par le chanteur Bing Crosby présente les premiers essais d'enregistrement d'images de télévision sur bande magnétique. Jusque-là, on ne savait enregistrer que le son : la télévision se regardait uniquement en direct. Cette démonstration ouvre la voie au magnétoscope moderne, perfectionné par la société Ampex en 1956, puis démocratisé dans les foyers avec le VHS à la fin des années 1970. Pouvoir enregistrer une émission, la revoir, la conserver : ce geste devenu banal naît de ces expériences de 1951, qui changent pour toujours notre rapport aux images." },
      { t: "Le Festival de Cannes prend son rythme annuel",
        s: "Après des débuts irréguliers, le Festival de Cannes s'installe au printemps en 1951. La grande tradition démarre vraiment.",
        b: "Créé en 1946 mais annulé certaines années faute de budget, le Festival de Cannes trouve enfin sa vitesse de croisière en 1951 : il se déroule désormais chaque année au printemps, sur la Croisette. C'est le début de la formule que l'on connaît, montée des marches, compétition internationale, stars et photographes du monde entier. Le festival devient rapidement le rendez-vous le plus prestigieux du cinéma mondial, capable de lancer des carrières et de faire d'une ville de la Côte d'Azur la capitale planétaire du septième art pendant deux semaines. La Palme d'or, elle, sera créée en 1955." }
    ],
    1952: [
      { t: "Première explosion d'une bombe H",
        s: "Les États-Unis font exploser la première bombe à hydrogène. Sa puissance dépasse tout ce qui existait.",
        b: "Le 1er novembre 1952, les États-Unis font exploser « Ivy Mike », la première bombe à hydrogène de l'histoire, sur un atoll du Pacifique. Sa puissance est environ 700 fois supérieure à celle de la bombe d'Hiroshima : l'île d'Elugelab est purement rayée de la carte. Contrairement à la bombe atomique classique qui repose sur la fission, la bombe H utilise la fusion nucléaire, le même mécanisme qui fait briller les étoiles. Cette démonstration terrifiante accélère la course aux armements avec l'URSS, qui réalisera son propre essai moins d'un an plus tard." },
      { t: "Élisabeth II monte sur le trône",
        s: "À la mort de son père George VI, Élisabeth devient reine à 25 ans. Son règne durera 70 ans.",
        b: "Le 6 février 1952, le roi George VI meurt dans son sommeil. Sa fille aînée Élisabeth, en voyage officiel au Kenya, apprend qu'elle est devenue reine à 25 ans. Elle prend le nom d'Élisabeth II et régnera 70 ans, un record absolu dans l'histoire britannique, jusqu'à sa mort en 2022. Elle traversera quinze Premiers ministres, de Winston Churchill à Liz Truss, la décolonisation, la guerre froide et l'ère d'Internet. Son couronnement, célébré en 1953 à l'abbaye de Westminster, sera le premier de l'histoire retransmis à la télévision, suivi par des millions de spectateurs." }
    ],
    1953: [
      { t: "Conquête de l'Everest",
        s: "Edmund Hillary et Tenzing Norgay atteignent le sommet de l'Everest, à 8 849 mètres. Personne n'y était jamais parvenu.",
        b: "Le 29 mai 1953, le Néo-Zélandais Edmund Hillary et le sherpa népalais Tenzing Norgay deviennent les premiers hommes à atteindre le sommet de l'Everest, le point culminant de la Terre à 8 849 mètres. Après des décennies de tentatives et plusieurs morts célèbres, dont George Mallory en 1924, l'expédition britannique réussit l'exploit avec des bouteilles d'oxygène et un équipement rudimentaire par rapport à aujourd'hui. Ils restent environ un quart d'heure au sommet. La nouvelle arrive à Londres le matin du couronnement d'Élisabeth II, décuplant la ferveur nationale. Hillary sera anobli, Tenzing deviendra une légende au Népal." },
      { t: "Couronnement d'Élisabeth II",
        s: "Le couronnement de la jeune reine est le premier retransmis à la télévision. Des millions de personnes le suivent en direct.",
        b: "Le 2 juin 1953, Élisabeth II est couronnée à l'abbaye de Westminster, à Londres. Fait inédit, la cérémonie est retransmise en direct à la télévision, contre l'avis d'une partie de la cour qui jugeait cela trop intrusif. Plus de 20 millions de Britanniques la suivent sur le petit écran, souvent chez le voisin équipé, et des millions d'autres dans le monde. Cet événement fait exploser les ventes de téléviseurs et marque symboliquement l'entrée de la monarchie, et de la société, dans l'ère de l'image. La jeune reine de 27 ans devient instantanément l'un des visages les plus connus de la planète." },
      { t: "Brigitte Bardot devient une icône",
        s: "La jeune Brigitte Bardot se fait remarquer au Festival de Cannes. Le mythe B.B. est en marche.",
        b: "En 1953, une jeune actrice de 18 ans crée la sensation au Festival de Cannes : Brigitte Bardot. Photographiée sur la plage, souriante et libre, elle incarne une nouvelle image de la femme, loin des stars figées de l'époque. Trois ans plus tard, le film « Et Dieu créa la femme » de Roger Vadim en fera une star planétaire et le symbole d'une France moderne et sensuelle. « B.B. » devient l'une des femmes les plus photographiées du monde, inspire chanteurs et couturiers, avant de quitter le cinéma en 1973 pour consacrer sa vie à la défense des animaux." }
    ],
    1954: [
      { t: "Le lien entre tabac et cancer est prouvé",
        s: "De grandes études scientifiques démontrent que fumer provoque le cancer du poumon. La lutte antitabac commence.",
        b: "En 1954, les résultats de vastes études médicales, notamment celle des médecins britanniques menée par Richard Doll et Austin Bradford Hill, établissent scientifiquement ce que l'on soupçonnait : fumer provoque le cancer du poumon. À une époque où l'on fume partout, dans les trains, les cinémas, les hôpitaux, et où la publicité vante les cigarettes, c'est un choc. Les industriels du tabac contre-attaquent en semant le doute pendant des décennies. Mais ces travaux de 1954 marquent la naissance de la lutte antitabac moderne, qui aboutira bien plus tard aux interdictions de publicité, aux paquets neutres et à l'interdiction de fumer dans les lieux publics." },
      { t: "Fin de la guerre d'Indochine, le Vietnam indépendant",
        s: "Après la défaite de Diên Biên Phu, les accords de Genève mettent fin à la guerre d'Indochine. Le Vietnam est coupé en deux.",
        b: "Le 7 mai 1954, après 57 jours de siège, le camp retranché français de Diên Biên Phu tombe face aux forces du Viêt Minh de Hô Chi Minh. Cette défaite militaire majeure précipite la fin de la guerre d'Indochine, qui durait depuis 1946. En juillet, les accords de Genève sont signés : la France se retire, le Vietnam devient indépendant mais il est provisoirement divisé en deux au niveau du 17e parallèle, un Nord communiste et un Sud soutenu par l'Occident. Cette division, censée être temporaire, débouchera sur la guerre du Vietnam, qui impliquera massivement les États-Unis jusqu'en 1975." }
    ],
    1955: [
      { t: "Catastrophe des 24 Heures du Mans",
        s: "Une voiture s'envole dans la foule pendant la course : 84 morts. C'est la pire tragédie de l'histoire du sport automobile.",
        b: "Le 11 juin 1955, pendant les 24 Heures du Mans, la Mercedes de Pierre Levegh percute une autre voiture, décolle et explose en projetant des débris en feu dans la tribune bondée. Le bilan est effroyable : 84 morts, dont le pilote, et plus de 120 blessés. C'est la plus grande catastrophe de l'histoire du sport automobile. Fait incroyable, la course n'est pas arrêtée, officiellement pour éviter que la foule ne bloque les secours en partant. Mercedes se retire de la compétition pendant des décennies, la Suisse interdit les courses sur circuit, et la sécurité automobile est repensée en profondeur." },
      { t: "Ouverture du premier Disneyland",
        s: "Walt Disney ouvre son premier parc à thème en Californie. Un rêve devenu réalité qui va conquérir le monde.",
        b: "Le 17 juillet 1955, Walt Disney inaugure Disneyland à Anaheim, en Californie. Ce premier parc à thème moderne, financé en partie grâce au succès de « Cendrillon » et à un partenariat avec la télévision, concrétise son rêve : un lieu où parents et enfants s'amusent ensemble dans des mondes imaginaires, avec un château, Main Street et des attractions immersives. Le jour de l'ouverture est chaotique, chaleur écrasante, asphalte encore frais, faux billets d'entrée, mais le succès est immédiat et colossal. Disneyland devient le modèle de tous les parcs à thème du monde, y compris Disneyland Paris, ouvert en 1992." },
      { t: "Mort de James Dean",
        s: "L'acteur de 24 ans se tue au volant de sa Porsche. Trois films auront suffi à en faire une légende éternelle.",
        b: "Le 30 septembre 1955, James Dean se tue sur une route de Californie au volant de sa Porsche 550 Spyder, surnommée « Little Bastard ». Il a 24 ans. L'acteur n'a tourné que trois grands films, « À l'est d'Éden », « La Fureur de vivre » et « Géant », dont deux sortiront après sa mort. Ce destin fulgurant fige à jamais son image : le jeune rebelle en blouson, beau, écorché, éternellement jeune. James Dean devient le symbole absolu de la jeunesse tourmentée des années 1950 et l'une des premières grandes icônes modernes, dont le visage orne encore aujourd'hui des posters dans le monde entier." }
    ],
    1956: [
      { t: "Crise du canal de Suez",
        s: "L'Égypte nationalise le canal de Suez. La France et le Royaume-Uni interviennent militairement, puis doivent reculer.",
        b: "En juillet 1956, le président égyptien Nasser nationalise le canal de Suez, voie stratégique entre l'Europe et l'Asie, jusque-là contrôlée par des intérêts franco-britanniques. En octobre, Israël, la France et le Royaume-Uni lancent une intervention militaire secrètement coordonnée. Militairement, c'est un succès rapide. Politiquement, c'est un désastre : les États-Unis et l'URSS, furieux, imposent un retrait humiliant. La crise de Suez révèle que les anciennes puissances coloniales ne peuvent plus agir sans l'accord des deux superpuissances. Elle accélère la décolonisation, renforce Nasser en héros du monde arabe et redessine les équilibres de la guerre froide." },
      { t: "Elvis Presley conquiert le monde",
        s: "Avec « Heartbreak Hotel », Elvis devient un phénomène planétaire. Le rock'n'roll s'impose et la jeunesse a trouvé son roi.",
        b: "En 1956, un jeune chanteur de Memphis au déhanché scandaleux explose au niveau mondial : Elvis Presley. « Heartbreak Hotel », « Hound Dog », « Don't Be Cruel » s'enchaînent en tête des ventes, et ses passages à la télévision américaine battent tous les records d'audience, au point que certaines chaînes ne le filment qu'au-dessus de la ceinture. Les adultes s'indignent, les adolescents s'enflamment : pour la première fois, la jeunesse a sa musique, sa mode, son idole. Elvis vendra plus d'un milliard de disques et restera « le King », figure fondatrice de toute la musique populaire moderne." }
    ],
    1957: [
      { t: "Spoutnik, premier satellite artificiel",
        s: "L'URSS place en orbite Spoutnik, une sphère qui émet un simple bip. La conquête spatiale vient de commencer.",
        b: "Le 4 octobre 1957, l'Union soviétique lance Spoutnik 1, une sphère métallique de 58 centimètres et 84 kilos, premier objet fabriqué par l'homme à être placé en orbite autour de la Terre. Son « bip-bip » régulier, capté par les radioamateurs du monde entier, fascine et terrifie : si les Soviétiques peuvent envoyer un satellite, ils peuvent envoyer une bombe. C'est un choc immense pour les États-Unis, persuadés de leur avance technologique. La course à l'espace est lancée : elle mènera à la création de la NASA en 1958, à Gagarine en 1961 et aux premiers pas sur la Lune en 1969." },
      { t: "Signature du traité de Rome",
        s: "Six pays, dont la France, fondent la Communauté économique européenne. C'est l'acte de naissance de l'Union européenne.",
        b: "Le 25 mars 1957, six pays, la France, l'Allemagne de l'Ouest, l'Italie, la Belgique, les Pays-Bas et le Luxembourg, signent à Rome le traité créant la Communauté économique européenne. Douze ans après une guerre qui a ravagé le continent, d'anciens ennemis choisissent de lier leurs économies pour rendre la guerre impossible entre eux : marché commun, suppression progressive des droits de douane, politiques communes. C'est l'acte fondateur de ce qui deviendra l'Union européenne, avec ses élargissements successifs, son marché unique et sa monnaie commune. Peu de traités auront autant transformé la vie quotidienne de centaines de millions d'Européens." }
    ],
    1958: [
      { t: "Naissance de la Ve République",
        s: "En pleine crise algérienne, la France adopte une nouvelle constitution. C'est le régime dans lequel nous vivons encore.",
        b: "En mai 1958, la crise algérienne menace de dégénérer en guerre civile : des généraux prennent le pouvoir à Alger et réclament le retour du général de Gaulle. Rappelé aux affaires, celui-ci pose ses conditions : une nouvelle constitution taillée pour un exécutif fort. Rédigée sous l'autorité de Michel Debré, elle est approuvée par référendum à près de 80 % des voix et promulguée le 4 octobre 1958. La Ve République est née : président puissant, gouvernement responsable devant l'Assemblée, parlement encadré. C'est, avec plusieurs révisions dont l'élection du président au suffrage universel en 1962, le régime politique de la France d'aujourd'hui." },
      { t: "De Gaulle élu président",
        s: "Charles de Gaulle est élu premier président de la Ve République. L'homme du 18 juin revient au sommet de l'État.",
        b: "Le 21 décembre 1958, Charles de Gaulle est élu premier président de la Ve République, à l'époque par un collège de grands électeurs et non encore au suffrage universel direct. À 68 ans, l'homme de l'appel du 18 juin 1940 revient au sommet de l'État après douze ans de « traversée du désert ». Il installe une pratique présidentielle forte, règle la question algérienne, dote la France de l'arme nucléaire et d'une diplomatie indépendante. Réélu en 1965, il gouvernera jusqu'à sa démission en 1969, après l'échec d'un référendum. Il reste la figure politique la plus admirée des Français." }
    ],
    1959: [
      { t: "Révolution cubaine",
        s: "Fidel Castro et ses guérilleros renversent le dictateur Batista. Cuba bascule et défiera bientôt les États-Unis.",
        b: "Le 1er janvier 1959, le dictateur cubain Fulgencio Batista s'enfuit de La Havane : les guérilleros de Fidel Castro, partis à quelques dizaines dans la Sierra Maestra, ont gagné. Castro, accompagné de son frère Raúl et d'Ernesto « Che » Guevara, prend le pouvoir. D'abord ambiguë, la révolution bascule vers le communisme et l'alliance avec l'URSS, à 150 kilomètres des côtes américaines. Suivront l'embargo américain, la tentative d'invasion de la baie des Cochons en 1961 et la crise des missiles de 1962, qui frôlera la guerre nucléaire. Castro dirigera Cuba pendant près d'un demi-siècle." },
      { t: "Naissance d'Astérix le Gaulois",
        s: "René Goscinny et Albert Uderzo publient la première aventure d'Astérix. Le petit Gaulois deviendra un géant mondial.",
        b: "Le 29 octobre 1959, dans le premier numéro du journal Pilote, paraît une nouvelle bande dessinée : « Astérix le Gaulois », imaginée par René Goscinny au scénario et Albert Uderzo au dessin. Un petit village gaulois qui résiste encore et toujours à l'envahisseur romain, une potion magique, des jeux de mots à chaque case : le succès est phénoménal. Astérix devient la bande dessinée française la plus vendue au monde, traduite en plus de cent langues, avec près de 400 millions d'albums écoulés, des films, un parc d'attractions, et même le premier satellite français baptisé en son honneur en 1965." }
    ],
    1960: [
      { t: "L'année des indépendances africaines",
        s: "En une seule année, 17 pays africains, dont 14 anciennes colonies françaises, deviennent indépendants.",
        b: "L'année 1960 est surnommée « l'année de l'Afrique » : 17 pays du continent accèdent à l'indépendance, dont 14 anciennes colonies françaises comme le Sénégal, la Côte d'Ivoire, le Mali, le Cameroun ou Madagascar. En quelques mois, la carte du monde est redessinée et l'ONU accueille une vague de nouveaux États. Cette décolonisation massive, tantôt négociée, tantôt arrachée, met fin à près d'un siècle de domination coloniale européenne en Afrique. Elle ouvre aussi une période complexe : frontières héritées de la colonisation, jeunes États à construire, et liens ambigus avec les anciennes métropoles, notamment ce que l'on appellera la « Françafrique »." },
      { t: "La télévision entre dans les foyers",
        s: "Le nombre de téléviseurs explose en France. La télé devient peu à peu le cœur de la vie des familles.",
        b: "Au tournant des années 1960, la télévision cesse d'être une curiosité pour devenir un phénomène de masse. En France, on passe d'environ un million de récepteurs en 1958 à plus de dix millions au milieu des années 1960. Une seule chaîne, en noir et blanc, mais des rendez-vous qui rassemblent tout le pays : le journal télévisé, « Cinq colonnes à la une », les variétés. Le meuble télé prend la place d'honneur du salon, on s'invite chez les voisins équipés, et les repas se réorganisent autour des programmes. Une révolution culturelle silencieuse qui va transformer la politique, la publicité et les loisirs." }
    ],
    1961: [
      { t: "Construction du mur de Berlin",
        s: "Dans la nuit du 12 au 13 août, Berlin est coupée en deux par un mur. Il séparera des familles pendant 28 ans.",
        b: "Dans la nuit du 12 au 13 août 1961, l'Allemagne de l'Est ferme brutalement la frontière à Berlin : barbelés d'abord, puis un mur de béton, des miradors et des champs de mines. Objectif : stopper l'hémorragie des Allemands de l'Est qui fuyaient vers l'Ouest, près de trois millions depuis 1949. Du jour au lendemain, des familles sont séparées, des rues coupées en deux, des fenêtres murées. Le « mur de la honte » devient le symbole physique de la guerre froide et du rideau de fer. Au moins 140 personnes mourront en tentant de le franchir, jusqu'à sa chute le 9 novembre 1989." },
      { t: "Gagarine, premier homme dans l'espace",
        s: "Le Soviétique Youri Gagarine effectue le premier vol spatial habité de l'histoire. Une orbite autour de la Terre en 108 minutes.",
        b: "Le 12 avril 1961, le cosmonaute soviétique Youri Gagarine, 27 ans, devient le premier être humain à voyager dans l'espace. À bord de la capsule Vostok 1, il effectue une orbite complète autour de la Terre en 108 minutes, avant de revenir sain et sauf en s'éjectant en parachute. Son sourire et sa phrase attribuée « La Terre est bleue » font le tour du monde. C'est un triomphe majeur pour l'URSS dans la course à l'espace, un mois avant le premier vol américain. Gagarine devient une idole planétaire. Il mourra en 1968 dans un accident d'avion d'entraînement, à 34 ans." }
    ],
    1962: [
      { t: "Fin de la guerre d'Algérie",
        s: "Les accords d'Évian mettent fin à huit ans de guerre. L'Algérie devient indépendante après 132 ans de présence française.",
        b: "Le 18 mars 1962, les accords d'Évian sont signés entre la France et le FLN algérien : un cessez-le-feu met fin à près de huit ans d'une guerre qui a fait des centaines de milliers de morts. Approuvée massivement par référendum des deux côtés de la Méditerranée, l'indépendance de l'Algérie est proclamée le 5 juillet 1962, après 132 ans de colonisation française. L'été 1962 voit l'exode dramatique de près d'un million de pieds-noirs vers la métropole, ainsi que le sort tragique des harkis. Cette guerre longtemps appelée pudiquement « les événements » reste l'une des pages les plus douloureuses et débattues de l'histoire française contemporaine." },
      { t: "Johnny Hallyday, idole nationale",
        s: "Johnny enflamme la jeunesse française. Le rock a trouvé son visage tricolore et les « yéyés » triomphent.",
        b: "En 1962, Johnny Hallyday, à peine 19 ans, est déjà le phénomène musical français : ses concerts déclenchent des émeutes de fans, ses disques s'arrachent, et la presse s'inquiète de cette jeunesse déchaînée. Avec Sylvie Vartan, Françoise Hardy ou Eddy Mitchell, il incarne la vague « yéyé », version française du rock'n'roll, popularisée par l'émission « Salut les copains ». L'année suivante, un concert gratuit place de la Nation réunira 150 000 jeunes et fera scandale. Johnny restera l'idole des jeunes pendant près de soixante ans de carrière, plus de cent millions de disques vendus, et une place unique dans le cœur des Français." }
    ],
    1963: [
      { t: "Assassinat de John F. Kennedy",
        s: "Le président américain est abattu en pleine rue à Dallas. Le monde entier est sous le choc.",
        b: "Le 22 novembre 1963, le président américain John Fitzgerald Kennedy est assassiné à Dallas, au Texas, abattu alors qu'il traverse la ville en voiture décapotable aux côtés de son épouse Jackie. Il avait 46 ans. Lee Harvey Oswald, arrêté quelques heures plus tard, est lui-même tué deux jours après, en direct à la télévision, par Jack Ruby. Cette mort brutale traumatise l'Amérique et le monde : chacun se souviendra où il était ce jour-là. L'enquête officielle conclut à un tireur isolé, mais les zones d'ombre alimenteront des décennies de théories, faisant de cet assassinat le plus commenté du 20e siècle." },
      { t: "Naissance de la Beatlemania",
        s: "Les Beatles déclenchent une hystérie collective au Royaume-Uni. La presse invente un mot : la « Beatlemania ».",
        b: "En 1963, quatre garçons de Liverpool mettent le Royaume-Uni sens dessus dessous : les Beatles. « Please Please Me », « She Loves You », « I Want to Hold Your Hand » s'enchaînent au sommet des ventes, et leurs concerts disparaissent sous les hurlements de fans en larmes. La presse britannique invente un mot pour décrire ce phénomène inédit : la « Beatlemania ». Début 1964, elle traversera l'Atlantique avec un passage historique à la télévision américaine devant 73 millions de téléspectateurs. John, Paul, George et Ringo deviennent le groupe le plus influent de l'histoire de la musique, et changent la pop pour toujours." }
    ],
    1964: [
      { t: "Prix Nobel de la paix pour Martin Luther King",
        s: "À 35 ans, le pasteur américain reçoit le prix Nobel de la paix pour son combat non violent contre la ségrégation.",
        b: "En décembre 1964, Martin Luther King reçoit à Oslo le prix Nobel de la paix. À 35 ans, il en est alors le plus jeune lauréat. Le pasteur noir américain est récompensé pour son combat non violent contre la ségrégation raciale aux États-Unis : boycott des bus de Montgomery, marches pacifiques, et son discours légendaire « I have a dream » prononcé un an plus tôt devant le Lincoln Memorial à Washington. L'année 1964 est aussi celle du Civil Rights Act, qui interdit la ségrégation dans les lieux publics. King poursuivra sa lutte jusqu'à son assassinat à Memphis, le 4 avril 1968." },
      { t: "Jeux olympiques de Tokyo",
        s: "Le Japon organise les premiers JO d'Asie et montre au monde sa renaissance. Premiers Jeux retransmis en mondovision.",
        b: "En octobre 1964, Tokyo accueille les premiers Jeux olympiques organisés en Asie. Pour le Japon, écrasé et ruiné en 1945, c'est une renaissance spectaculaire : le monde découvre un pays ultramoderne, son train à grande vitesse Shinkansen inauguré quelques jours avant l'ouverture, ses stades futuristes. Le dernier porteur de la flamme est un étudiant né à Hiroshima le jour de la bombe, symbole bouleversant. Ce sont aussi les premiers Jeux retransmis en direct par satellite à travers la planète, et le judo, sport national, y fait son entrée olympique. Tokyo 1964 reste le modèle des Jeux qui transforment un pays." }
    ],
    1965: [
      { t: "Première élection présidentielle au suffrage universel",
        s: "Pour la première fois, les Français élisent leur président au suffrage universel direct. De Gaulle bat Mitterrand au second tour.",
        b: "En décembre 1965, pour la première fois de la Ve République, le président est élu directement par tous les Français, une réforme voulue par de Gaulle et adoptée par référendum en 1962. Surprise du scrutin : le général, donné triomphant, est mis en ballottage au premier tour et doit affronter au second un certain François Mitterrand, candidat unique de la gauche. De Gaulle l'emporte avec environ 55 % des voix. Cette campagne voit aussi la télévision entrer massivement dans le jeu politique, avec du temps d'antenne pour tous les candidats. L'élection présidentielle devient dès lors le rendez-vous central de la vie politique française." },
      { t: "Astérix, premier satellite français",
        s: "La France lance son premier satellite, baptisé Astérix. Elle devient la troisième puissance spatiale mondiale.",
        b: "Le 26 novembre 1965, depuis la base d'Hammaguir au Sahara algérien, une fusée Diamant place en orbite le premier satellite français, malicieusement baptisé Astérix, en hommage au petit Gaulois de Goscinny et Uderzo. La France devient ainsi la troisième puissance spatiale de l'histoire, après l'URSS et les États-Unis, et surtout la première à y parvenir avec un lanceur entièrement conçu par elle. Ce succès du programme voulu par de Gaulle fonde la filière spatiale française, qui donnera naissance au programme européen Ariane et à Kourou. Détail amusant : Astérix, éteint depuis longtemps, tourne toujours au-dessus de nos têtes." }
    ],
    1966: [
      { t: "Coupe du monde en Angleterre",
        s: "L'Angleterre remporte « sa » Coupe du monde à Wembley. Un Mondial suivi massivement à la télévision.",
        b: "En juillet 1966, l'Angleterre organise et remporte la Coupe du monde de football, la seule de son histoire, en battant l'Allemagne de l'Ouest 4 à 2 après prolongation en finale à Wembley. Le match reste célèbre pour le but fantôme de Geoff Hurst, dont on débat encore aujourd'hui : le ballon a-t-il vraiment franchi la ligne ? Hurst signe le seul triplé jamais réussi en finale de Coupe du monde. C'est aussi l'un des premiers Mondiaux véritablement télévisuels, suivi par des centaines de millions de spectateurs, qui installe définitivement le football comme le grand spectacle planétaire que l'on connaît." },
      { t: "La France quitte le commandement de l'OTAN",
        s: "De Gaulle retire la France du commandement militaire intégré de l'OTAN. Les bases américaines doivent quitter le pays.",
        b: "En mars 1966, le général de Gaulle annonce que la France se retire du commandement militaire intégré de l'OTAN, tout en restant membre de l'alliance atlantique. Conséquence spectaculaire : les bases et les quelque 30 000 soldats américains stationnés en France doivent plier bagage, et le siège de l'OTAN quitte Paris pour Bruxelles. De Gaulle affirme ainsi l'indépendance nationale, appuyée sur la force de dissuasion nucléaire française, refusant que les armées françaises soient placées sous commandement américain. Cette décision, très symbolique de la politique gaullienne, durera plus de quarante ans : la France ne réintégrera le commandement intégré qu'en 2009." }
    ],
    1967: [
      { t: "Première greffe du cœur",
        s: "En Afrique du Sud, le chirurgien Christiaan Barnard réalise la première transplantation cardiaque humaine. Un exploit qui stupéfie le monde.",
        b: "Le 3 décembre 1967, au Cap, en Afrique du Sud, le chirurgien Christiaan Barnard réalise la première greffe du cœur de l'histoire : il transplante le cœur d'une jeune femme morte dans un accident sur Louis Washkansky, un épicier de 54 ans condamné par la maladie. Le patient survit 18 jours avant de succomber à une pneumonie, mais la démonstration est faite : on peut remplacer un cœur humain. L'exploit fait la une du monde entier et Barnard devient une star. Aujourd'hui, grâce aux progrès contre le rejet, des milliers de greffes cardiaques sont réalisées chaque année et des patients vivent des décennies avec leur nouveau cœur." },
      { t: "L'explosion de la pop culture",
        s: "1967, c'est le « Summer of Love » : hippies, musique psychédélique et le mythique album « Sgt. Pepper » des Beatles.",
        b: "L'année 1967 est le sommet de la vague pop et psychédélique. À San Francisco, des dizaines de milliers de jeunes convergent pour le « Summer of Love » : cheveux longs, fleurs, pacifisme et musique planante. Les Beatles publient « Sgt. Pepper's Lonely Hearts Club Band », souvent cité comme l'album le plus influent de l'histoire, tandis que Jimi Hendrix embrase le festival de Monterey. La jeunesse occidentale invente une contre-culture : refus de la guerre du Vietnam, libération des mœurs, expérimentations en tout genre. Cette explosion créative et contestataire prépare les grands mouvements de 1968 et façonne durablement la musique, la mode et la publicité." }
    ],
    1968: [
      { t: "Mai 68 en France",
        s: "Étudiants en révolte, barricades, puis grève générale de dix millions de salariés : la France s'arrête pendant un mois.",
        b: "En mai 1968, une contestation étudiante partie de Nanterre et de la Sorbonne embrase la France : barricades au Quartier latin, affrontements avec la police, slogans restés célèbres comme « Il est interdit d'interdire ». Le mouvement s'étend au monde ouvrier : jusqu'à dix millions de salariés en grève, le pays paralysé, l'essence introuvable. Le pouvoir vacille, de Gaulle disparaît même une journée pour consulter l'armée à Baden-Baden, avant de reprendre la main en dissolvant l'Assemblée. Les accords de Grenelle augmentent fortement les salaires. Au-delà de la crise, Mai 68 transforme durablement la société française : rapports d'autorité, place des femmes, mœurs et culture." },
      { t: "Assassinat de Martin Luther King",
        s: "Le pasteur, apôtre de la non-violence, est abattu à Memphis. Des émeutes éclatent dans tout le pays.",
        b: "Le 4 avril 1968, Martin Luther King est assassiné d'une balle alors qu'il se trouve au balcon de son motel à Memphis, où il était venu soutenir une grève d'éboueurs noirs. Il avait 39 ans. La mort de l'apôtre de la non-violence, prix Nobel de la paix, provoque une onde de choc mondiale et des émeutes dans plus d'une centaine de villes américaines. James Earl Ray est condamné pour le meurtre, dont les circonstances exactes restent discutées. King laisse un héritage immense : son combat a fait tomber la ségrégation légale, et son « I have a dream » demeure l'un des discours les plus célèbres de l'histoire." }
    ],
    1969: [
      { t: "Premier pas de l'Homme sur la Lune",
        s: "Neil Armstrong pose le pied sur la Lune devant 600 millions de téléspectateurs. « Un petit pas pour l'homme... »",
        b: "Le 21 juillet 1969, à 3h56 heure française, l'Américain Neil Armstrong pose le pied sur la Lune et prononce sa phrase historique : « C'est un petit pas pour l'homme, un bond de géant pour l'humanité. » Avec Buzz Aldrin, il passe environ deux heures et demie à marcher sur la mer de la Tranquillité, pendant que Michael Collins les attend en orbite. Près de 600 millions de personnes suivent l'événement en direct à la télévision, un record absolu à l'époque. Huit ans après le défi lancé par Kennedy, la mission Apollo 11 marque le sommet de la course à l'espace et reste l'un des plus grands exploits de l'histoire humaine." },
      { t: "Festival de Woodstock",
        s: "Un demi-million de jeunes se rassemblent pour trois jours de musique, de paix et de boue. Le concert du siècle.",
        b: "Du 15 au 18 août 1969, dans une ferme de l'État de New York, se tient le festival de Woodstock : environ 450 000 jeunes, deux fois plus que prévu, convergent pour « trois jours de paix et de musique ». Sous la pluie et dans la boue, se produisent Jimi Hendrix, qui joue un hymne américain distordu resté légendaire, Janis Joplin, The Who, Santana ou Joe Cocker. Malgré le chaos logistique, routes bloquées, vivres épuisés, l'événement se déroule dans un esprit pacifique qui stupéfie l'Amérique. Woodstock devient instantanément le symbole de la génération hippie et le concert mythique auquel tout festival rêve encore de ressembler." },
      { t: "Premier vol du Concorde",
        s: "L'avion supersonique franco-britannique décolle pour la première fois à Toulouse. Paris-New York en 3h30 devient possible.",
        b: "Le 2 mars 1969, à Toulouse, le Concorde effectue son tout premier vol, aux mains du pilote d'essai André Turcat. Fruit d'une coopération franco-britannique lancée en 1962, cet avion au nez basculant est le premier appareil supersonique destiné aux passagers : il volera à Mach 2, soit plus de 2 100 km/h, reliant Paris à New York en environ 3h30, moins de temps que le décalage horaire. Prouesse technologique absolue mais gouffre financier, il n'entrera en service qu'en 1976 et ne sera construit qu'à vingt exemplaires. Retiré en 2003, trois ans après l'accident de Gonesse, il reste une légende de l'aviation." }
    ],
    1970: [
      { t: "Mort de Charles de Gaulle",
        s: "Le général s'éteint à Colombey-les-Deux-Églises. « La France est veuve », déclare le président Pompidou.",
        b: "Le 9 novembre 1970, Charles de Gaulle meurt brutalement d'une rupture d'anévrisme à Colombey-les-Deux-Églises, à 79 ans, alors qu'il faisait une réussite aux cartes. L'homme du 18 juin, le libérateur, le fondateur de la Ve République s'était retiré de la vie publique après sa démission de 1969. Le président Georges Pompidou annonce la nouvelle par une phrase restée célèbre : « Le général de Gaulle est mort. La France est veuve. » Conformément à ses volontés, il est enterré simplement à Colombey, sans funérailles nationales, pendant que les chefs d'État du monde entier se recueillent à Notre-Dame de Paris." },
      { t: "Les premières calculatrices de poche",
        s: "Les toutes premières calculatrices électroniques de poche apparaissent. Le calcul tient désormais dans la main.",
        b: "En 1970, les premières calculatrices électroniques de poche font leur apparition, comme la Canon Pocketronic issue de travaux de Texas Instruments. Pour la première fois, additionner, soustraire, multiplier et diviser tient dans la main, sans manivelle ni machine de bureau d'un quintal. Ces premiers modèles coûtent l'équivalent d'un mois de salaire et affichent à peine quelques chiffres, mais la miniaturisation est en marche : en quelques années, les prix s'effondrent et la calculatrice envahit cartables et bureaux, reléguant la règle à calcul au musée. C'est l'un des premiers objets électroniques grand public, ancêtre de poche de nos smartphones." }
    ],
    1971: [
      { t: "Création de Greenpeace",
        s: "Des militants partent en bateau protester contre un essai nucléaire américain. Greenpeace est né.",
        b: "En septembre 1971, une poignée de militants pacifistes et écologistes embarquent à Vancouver, au Canada, sur un vieux chalutier rebaptisé « Greenpeace » pour aller protester contre un essai nucléaire américain en Alaska. Le bateau n'atteindra jamais la zone, mais le coup médiatique est réussi et l'essai suivant sera annulé. De cette expédition naît l'organisation Greenpeace, qui invente une nouvelle forme de militantisme : l'action directe non violente et spectaculaire, pensée pour les caméras. Zodiac face aux baleiniers, banderoles sur les monuments... Greenpeace deviendra l'ONG écologiste la plus connue au monde, présente dans des dizaines de pays." },
      { t: "Le premier microprocesseur Intel",
        s: "Intel lance le 4004, premier microprocesseur commercialisé. Toute l'informatique moderne descend de cette puce.",
        b: "En novembre 1971, la jeune société américaine Intel commercialise le 4004, considéré comme le premier microprocesseur de l'histoire : pour la première fois, tout le « cerveau » d'un ordinateur tient sur une seule puce de silicium de quelques millimètres, gravée avec 2 300 transistors. Conçu à l'origine pour une calculatrice japonaise, le 4004 a la puissance de calcul des énormes ordinateurs des années 1940, dans un format minuscule. Cette invention déclenche la révolution numérique : ordinateurs personnels, consoles, téléphones, voitures... Aujourd'hui, les puces qui équipent nos smartphones contiennent des dizaines de milliards de transistors, mais toutes descendent de cette petite puce de 1971." }
    ],
    1972: [
      { t: "Attentat des Jeux olympiques de Munich",
        s: "Un commando palestinien prend en otage puis tue onze athlètes israéliens en plein JO. Le monde découvre le terrorisme en direct.",
        b: "Le 5 septembre 1972, en pleins Jeux olympiques de Munich, un commando palestinien de l'organisation Septembre noir s'introduit dans le village olympique et prend en otage l'équipe d'Israël. Après une journée de tractations suivies en direct par des centaines de millions de téléspectateurs, l'assaut de la police allemande à l'aéroport tourne au désastre : les onze athlètes et entraîneurs israéliens sont tués, ainsi qu'un policier et cinq des huit terroristes. Fait controversé, les Jeux reprennent après une simple journée de deuil. Ce drame fait entrer le terrorisme international dans l'ère médiatique et bouleverse pour toujours la sécurité des grands événements." },
      { t: "Le magnétoscope entre à la maison",
        s: "Les premiers magnétoscopes à cassette pour le grand public arrivent. On peut enfin enregistrer la télévision chez soi.",
        b: "En 1972, Philips lance le premier magnétoscope à cassette destiné au grand public, le VCR N1500. Pour la première fois, une famille peut enregistrer une émission pour la regarder plus tard, un concept révolutionnaire baptisé plus tard « télévision différée ». L'appareil coûte une fortune et les cassettes ne durent qu'une heure, mais l'idée est lancée. À la fin de la décennie, la guerre des formats fera rage entre le VHS de JVC et le Betamax de Sony, gagnée par le VHS. Le magnétoscope règnera sur les salons pendant trente ans, avant d'être détrôné par le DVD puis le streaming." }
    ],
    1973: [
      { t: "Premier choc pétrolier",
        s: "Les pays arabes réduisent leur production de pétrole : les prix quadruplent. Fin des Trente Glorieuses.",
        b: "En octobre 1973, en pleine guerre du Kippour entre Israël et ses voisins, les pays arabes exportateurs de pétrole décrètent un embargo contre les alliés d'Israël et réduisent leur production. En quelques mois, le prix du baril quadruple. Pour les économies occidentales, gavées de pétrole bon marché depuis 1945, c'est un séisme : inflation, chômage, récession. En France, c'est la fin des Trente Glorieuses et le début des campagnes d'économie d'énergie, « chasse au gaspi », limitations de vitesse, fin des illuminations. Ce choc pousse aussi la France à lancer son grand programme électronucléaire, qui fournit encore aujourd'hui l'essentiel de son électricité." },
      { t: "Mort de Pablo Picasso",
        s: "Le peintre le plus célèbre du 20e siècle s'éteint en France à 91 ans, laissant une œuvre de dizaines de milliers de créations.",
        b: "Le 8 avril 1973, Pablo Picasso meurt à Mougins, dans le sud de la France, à 91 ans. Né à Malaga en 1881, installé en France dès sa jeunesse, il aura traversé et souvent inventé tous les bouleversements de l'art moderne : périodes bleue et rose, cubisme cofondé avec Braque, « Les Demoiselles d'Avignon », « Guernica » peint en 1937 contre les bombardements franquistes. Créateur torrentiel, il laisse des dizaines de milliers d'œuvres, peintures, sculptures, céramiques, dessins. Sa succession donnera naissance au musée Picasso de Paris. Il reste l'artiste le plus célèbre du 20e siècle, dont les toiles atteignent des sommets historiques aux enchères." }
    ],
    1974: [
      { t: "Giscard d'Estaing élu président",
        s: "À 48 ans, Valéry Giscard d'Estaing devient le plus jeune président de la Ve République et lance de grandes réformes de société.",
        b: "Le 19 mai 1974, après la mort soudaine de Georges Pompidou, Valéry Giscard d'Estaing est élu président de la République face à François Mitterrand, avec 50,8 % des voix, l'un des scrutins les plus serrés de l'histoire. À 48 ans, il est alors le plus jeune président de la Ve République et veut incarner la modernité : il remonte les Champs-Élysées à pied, s'invite à dîner chez les Français, joue de l'accordéon. Son septennat lance des réformes de société majeures : majorité à 18 ans, loi Veil sur l'IVG, divorce par consentement mutuel, collège unique. Il sera battu par Mitterrand en 1981." },
      { t: "La majorité passe à 18 ans",
        s: "La majorité civile passe de 21 à 18 ans. Des millions de jeunes deviennent adultes du jour au lendemain.",
        b: "Le 5 juillet 1974, l'une des premières lois du septennat Giscard abaisse la majorité de 21 à 18 ans. Du jour au lendemain, environ deux millions et demi de jeunes Français deviennent majeurs : droit de vote, droit de se marier sans autorisation parentale, de signer un contrat, d'ouvrir un compte, de passer le permis sans tuteur. La mesure, promesse de campagne tenue en quelques semaines, accompagne l'esprit post-68 : reconnaître l'autonomie d'une jeunesse qui avait fait irruption dans la vie publique. La plupart des démocraties feront le même choix dans la décennie. En 1974, on pouvait donc voter à 18 ans... mais l'on votait pour sept ans de présidence." },
      { t: "Les limitations de vitesse se généralisent",
        s: "Conséquence du choc pétrolier et de l'hécatombe routière, la vitesse est désormais limitée sur toutes les routes de France.",
        b: "Au début des années 1970, la route tue massivement en France : plus de 16 000 morts par an, un record jamais égalé depuis. Jusqu'alors, hors agglomération, la vitesse était libre sur la plupart des routes. Le choc pétrolier de 1973 et cette hécatombe décident le gouvernement : entre fin 1973 et 1974, des limitations généralisées sont instaurées, notamment 130 km/h sur autoroute et 90 km/h sur route, des valeurs qui structureront la conduite des Français pendant des décennies. Couplées à l'obligation du port de la ceinture à l'avant, ces mesures font chuter la mortalité de façon spectaculaire dès les premières années." }
    ],
    1975: [
      { t: "La loi Veil sur l'IVG",
        s: "Portée par Simone Veil face à une Assemblée hostile, la loi dépénalisant l'avortement est promulguée.",
        b: "Le 17 janvier 1975 est promulguée la loi dépénalisant l'interruption volontaire de grossesse, défendue par la ministre de la Santé Simone Veil. Fin 1974, cette rescapée d'Auschwitz avait affronté pendant trois jours et trois nuits une Assemblée presque exclusivement masculine et souvent d'une violence inouïe, jusqu'aux attaques personnelles les plus abjectes. Son discours, prononcé d'une voix ferme, reste un moment majeur de l'histoire parlementaire française. Votée grâce aux voix de la gauche, d'abord pour cinq ans puis définitivement en 1979, la loi Veil est devenue l'un des acquis les plus consensuels de la société française. L'IVG a été inscrite dans la Constitution en 2024." },
      { t: "Fin de la guerre du Vietnam",
        s: "Saïgon tombe aux mains des communistes. Après 30 ans de guerre, le Vietnam est réunifié et l'Amérique traumatisée.",
        b: "Le 30 avril 1975, les chars nord-vietnamiens entrent dans Saïgon : la capitale du Sud tombe, deux ans après le retrait des troupes américaines. Les images des derniers hélicoptères évacuant dans la panique l'ambassade des États-Unis font le tour du monde. C'est la fin d'une guerre de trente ans, d'abord contre la France puis contre l'Amérique, qui a fait des millions de morts vietnamiens et 58 000 morts américains. Le Vietnam est réunifié sous régime communiste, Saïgon rebaptisée Hô-Chi-Minh-Ville, et des centaines de milliers de « boat people » fuient par la mer. Pour les États-Unis, c'est un traumatisme national durable, la première guerre perdue de leur histoire." }
    ],
    1976: [
      { t: "Naissance d'Apple",
        s: "Steve Jobs et Steve Wozniak fondent Apple dans un garage californien. La petite pomme deviendra un géant planétaire.",
        b: "Le 1er avril 1976, deux jeunes passionnés d'électronique, Steve Jobs, 21 ans, et Steve Wozniak, 25 ans, fondent Apple Computer, en partie dans le garage familial des Jobs, en Californie. Leur premier produit, l'Apple I, est une carte d'ordinateur vendue 666,66 dollars aux bricoleurs. L'année suivante, l'Apple II démocratisera l'ordinateur personnel. Suivront le Macintosh en 1984, l'éviction de Jobs, son retour triomphal en 1997, puis l'iPod, l'iPhone et l'iPad, qui feront d'Apple l'une des entreprises les plus valorisées de l'histoire. Le garage de Palo Alto est devenu un lieu de pèlerinage, symbole du rêve de la Silicon Valley." },
      { t: "La canicule et la sécheresse de 1976",
        s: "Une sécheresse historique frappe la France. L'État crée même un « impôt sécheresse » pour indemniser les agriculteurs.",
        b: "L'été 1976 reste dans les mémoires comme celui de la grande sécheresse : après un hiver et un printemps presque sans pluie, une canicule s'abat sur la moitié nord de la France et une bonne partie de l'Europe. Les rivières s'assèchent, les pelouses grillent, les récoltes s'effondrent et le bétail manque de fourrage. Le gouvernement instaure une majoration exceptionnelle d'impôt, resté célèbre sous le nom d'« impôt sécheresse », pour financer l'aide aux agriculteurs sinistrés. Pendant des décennies, 1976 restera la référence absolue de l'été extrême en France, avant d'être détrônée par les canicules du 21e siècle." }
    ],
    1977: [
      { t: "Sortie de « La Guerre des étoiles »",
        s: "Le film de George Lucas déclenche un raz-de-marée mondial. La saga Star Wars et le blockbuster moderne sont nés.",
        b: "Le 25 mai 1977 sort aux États-Unis « Star Wars », rebaptisé en France « La Guerre des étoiles » à sa sortie en octobre. Personne n'y croyait, à commencer par les studios : George Lucas a même renoncé à une partie de son salaire en échange des produits dérivés et des suites, ce qui fera de lui un milliardaire. Le film pulvérise tous les records, les spectateurs y retournent dix fois, et Dark Vador, la princesse Leia et la Force entrent dans la mythologie mondiale. Avec « Les Dents de la mer » sorti deux ans plus tôt, Star Wars invente le blockbuster moderne et transforme Hollywood pour toujours." },
      { t: "Ouverture du Centre Pompidou",
        s: "Le musée à l'architecture « usine à gaz », tuyaux apparents et escalators en façade, ouvre à Paris. Scandale, puis triomphe.",
        b: "Le 31 janvier 1977 est inauguré à Paris le Centre national d'art et de culture Georges-Pompidou, voulu par le président défunt pour offrir à la capitale un grand lieu d'art moderne. Son architecture, signée Renzo Piano et Richard Rogers, fait scandale : structure métallique apparente, tuyaux multicolores, escalators dans un tube de verre en façade. On le surnomme « la raffinerie » ou « Notre-Dame de la Tuyauterie ». Le public, lui, tranche vite : le succès est immédiat et massif. Beaubourg devient l'un des lieux culturels les plus visités du monde, et son architecture jadis moquée est aujourd'hui classée parmi les icônes du 20e siècle." },
      { t: "Mort d'Elvis Presley",
        s: "Le King meurt à 42 ans dans sa propriété de Graceland. La planète rock est en deuil.",
        b: "Le 16 août 1977, Elvis Presley est retrouvé mort dans sa propriété de Graceland, à Memphis, à seulement 42 ans. Usé par les excès, les médicaments et des années de shows épuisants à Las Vegas, le King s'éteint prématurément, et des dizaines de milliers de fans effondrés convergent vers sa maison. Sa mort déclenche un deuil planétaire et un phénomène qui ne s'est jamais démenti : disques réédités en masse, imitateurs par milliers, pèlerinages annuels à Graceland devenu musée. Avec plus d'un milliard de disques vendus, Elvis reste « le King », le visage fondateur du rock'n'roll et l'une des icônes absolues du 20e siècle." }
    ],
    1978: [
      { t: "Naissance du premier bébé éprouvette",
        s: "Louise Brown, premier être humain conçu par fécondation in vitro, naît en Angleterre. Une révolution médicale.",
        b: "Le 25 juillet 1978 naît en Angleterre Louise Brown, le premier « bébé éprouvette » de l'histoire : elle a été conçue par fécondation in vitro, la rencontre de l'ovule et du spermatozoïde ayant eu lieu en laboratoire avant réimplantation dans l'utérus de sa mère. L'exploit des médecins Robert Edwards et Patrick Steptoe, accueilli entre émerveillement et polémiques éthiques, ouvre une ère nouvelle pour les millions de couples infertiles. En France, le premier bébé éprouvette, Amandine, naîtra en 1982. Depuis, plus de dix millions d'enfants sont nés par FIV dans le monde, et Edwards recevra le prix Nobel de médecine en 2010." },
      { t: "Goldorak débarque en France",
        s: "Le robot japonais envahit les écrans français dans Récré A2. C'est le début de la déferlante des dessins animés japonais.",
        b: "Le 3 juillet 1978, dans l'émission Récré A2, les enfants français découvrent « Goldorak », un dessin animé japonais mettant en scène un robot géant piloté par le prince Actarus. Le succès est foudroyant et sans précédent : cour de récré monopolisée, jouets dévalisés, générique connu par cœur, jusqu'à une couverture de Paris Match titrant sur « Goldorak, l'idole des enfants ». C'est la première grande vague de l'animation japonaise en France, qui prépare le terrain à Candy, Albator puis au Club Dorothée et à toute la culture manga. Certains adultes s'inquiètent de sa violence... un débat qui reviendra à chaque génération." }
    ],
    1979: [
      { t: "Révolution islamique en Iran",
        s: "Le shah d'Iran est chassé, l'ayatollah Khomeiny instaure une République islamique. Le Moyen-Orient bascule.",
        b: "En janvier 1979, après des mois de manifestations monstres, le shah d'Iran, allié de l'Occident, fuit son pays. Le 1er février, l'ayatollah Khomeiny, chef religieux exilé pendant quinze ans, notamment en France, rentre triomphalement à Téhéran devant des millions de personnes. En quelques mois, il instaure une République islamique : la charia devient loi, le voile obligatoire, l'opposition est écrasée. En novembre, des étudiants islamistes prennent en otage le personnel de l'ambassade américaine pendant 444 jours. Cette révolution bouleverse durablement le Moyen-Orient et les relations entre l'Iran et l'Occident, avec des répliques qui se font sentir encore aujourd'hui." },
      { t: "Sony lance le Walkman",
        s: "Sony invente le baladeur : la musique devient portable et personnelle. Un objet culte est né.",
        b: "Le 1er juillet 1979, Sony commercialise au Japon un petit appareil bleu et argent qui va changer le rapport du monde à la musique : le Walkman. Pour la première fois, chacun peut emporter sa musique partout, au casque, dans la rue, le bus ou en faisant son jogging. L'idée venait du cofondateur de Sony, qui voulait écouter de l'opéra en avion. Moqué au départ, « qui voudrait d'un magnétophone qui n'enregistre pas ? », le Walkman se vend à plus de 400 millions d'exemplaires toutes versions confondues. Il invente la bulle musicale personnelle, dont les écouteurs blancs de l'iPod puis nos smartphones sont les héritiers directs." }
    ],
    1980: [
      { t: "Attentat de la rue Copernic",
        s: "Une bombe explose devant une synagogue à Paris : 4 morts. La France découvre le retour du terrorisme antisémite.",
        b: "Le 3 octobre 1980, une bombe placée sur une moto explose devant la synagogue de la rue Copernic, à Paris, à l'heure de l'office du shabbat. Quatre passants sont tués et des dizaines de personnes blessées. C'est le premier attentat meurtrier visant la communauté juive en France depuis la Seconde Guerre mondiale, et il provoque une émotion immense, amplifiée par une phrase maladroite du Premier ministre Raymond Barre restée tristement célèbre. Des centaines de milliers de personnes manifestent contre l'antisémitisme. L'enquête, longue de plusieurs décennies, aboutira en 2023 à la condamnation en son absence d'un suspect libano-canadien, plus de quarante ans après les faits." },
      { t: "Pac-Man dévore le monde",
        s: "Le petit rond jaune japonais devient le jeu vidéo le plus populaire de la planète. Les salles d'arcade explosent.",
        b: "En mai 1980, la société japonaise Namco lance dans les salles d'arcade un jeu d'un genre nouveau : Pac-Man, un petit rond jaune qui avale des pastilles en fuyant quatre fantômes. Son créateur, Toru Iwatani, voulait un jeu non violent capable d'attirer aussi les filles, et se serait inspiré d'une pizza à laquelle il manquait une part. Le succès est stratosphérique : Pac-Man devient le jeu d'arcade le plus rentable de l'histoire, génère dessins animés, chansons et produits dérivés, et fait entrer le jeu vidéo dans la culture populaire mondiale. Son design est aujourd'hui exposé au MoMA de New York." }
    ],
    1981: [
      { t: "François Mitterrand élu président",
        s: "Le 10 mai 1981, la gauche arrive au pouvoir pour la première fois sous la Ve République. Liesse place de la Bastille.",
        b: "Le 10 mai 1981 à 20 heures, le visage de François Mitterrand s'affiche sur les écrans de télévision : avec 51,8 % des voix face à Valéry Giscard d'Estaing, il devient le premier président socialiste de la Ve République. Des dizaines de milliers de personnes fêtent l'événement sous la pluie place de la Bastille. Après 23 ans de droite au pouvoir, l'alternance fait entrer des ministres communistes au gouvernement, ce qui inquiète jusqu'à Washington. Suivent des réformes marquantes : abolition de la peine de mort, retraite à 60 ans, cinquième semaine de congés payés, radios libres. Mitterrand restera 14 ans à l'Élysée, un record." },
      { t: "Abolition de la peine de mort",
        s: "Portée par Robert Badinter, l'abolition de la peine de mort est votée. La guillotine, c'est fini.",
        b: "Le 9 octobre 1981, la France abolit la peine de mort. Quelques semaines plus tôt, le garde des Sceaux Robert Badinter, avocat qui avait vu guillotiner l'un de ses clients, prononçait devant l'Assemblée un discours historique : « J'ai l'honneur, au nom du gouvernement de la République, de demander à l'Assemblée nationale l'abolition de la peine de mort en France. » Le vote est acquis alors qu'une majorité de Français y était encore opposée. La France était l'un des derniers pays d'Europe occidentale à guillotiner, la dernière exécution datant de 1977 à Marseille. L'abolition sera inscrite dans la Constitution en 2007." },
      { t: "Le TGV entre en service",
        s: "Le train orange relie Paris à Lyon à 260 km/h. La France devient le pays du train à grande vitesse.",
        b: "Le 22 septembre 1981, le président Mitterrand inaugure la ligne à grande vitesse Paris-Lyon : le TGV entre en service commercial, ramenant le trajet à 2h40 puis bientôt 2 heures. Avec sa livrée orange devenue culte, il roule à 260 km/h, un record mondial pour un train régulier, et réconcilie les Français avec le rail au moment où l'avion et l'autoroute semblaient avoir gagné. Le succès est immédiat et massif. Le réseau s'étendra vers l'Atlantique, le Nord, la Méditerranée et l'Europe, et le TGV battra plusieurs records du monde de vitesse, dont 574,8 km/h en 2007. Plus de trois milliards de voyageurs l'ont emprunté depuis." }
    ],
    1982: [
      { t: "« E.T. » au cinéma",
        s: "Le petit extraterrestre de Spielberg fait pleurer la planète entière et bat tous les records du box-office.",
        b: "En 1982, Steven Spielberg sort « E.T. l'extra-terrestre », l'histoire d'un petit alien botaniste oublié sur Terre et recueilli par un garçon nommé Elliott. Vélo volant devant la lune, doigt lumineux, « E.T. téléphone maison » : le film devient instantanément mythique et détrône « La Guerre des étoiles » comme plus gros succès de tous les temps, un titre qu'il gardera onze ans. En France, sorti fin 1982, il attire plus de neuf millions de spectateurs. Conçu par Spielberg comme un écho à son enfance marquée par le divorce de ses parents, E.T. reste l'un des personnages les plus aimés de l'histoire du cinéma." },
      { t: "Coupe du monde en Espagne, le drame de Séville",
        s: "La France de Platini tombe en demi-finale face à la RFA, après un match légendaire et cruel. Toute une nation traumatisée.",
        b: "Le 8 juillet 1982, à Séville, la France dispute contre la RFA l'une des demi-finales de Coupe du monde les plus dramatiques de l'histoire. L'agression du gardien allemand Schumacher sur Battiston, sorti inconscient sans même une faute sifflée, scandalise le monde. Menés puis héroïques, les Bleus de Platini mènent 3 à 1 en prolongation avant de se faire rejoindre, puis de s'incliner aux tirs au but, les premiers de l'histoire du Mondial. La « tragédie de Séville » traumatise durablement le football français, mais cette équipe magnifique annonce le sacre européen de 1984. L'Italie de Paolo Rossi remportera la finale." },
      { t: "Sortie de « Thriller »",
        s: "Michael Jackson publie « Thriller », qui deviendra l'album le plus vendu de tous les temps.",
        b: "Le 30 novembre 1982, Michael Jackson, 24 ans, publie « Thriller ». Porté par « Billie Jean », « Beat It » et la chanson-titre, l'album pulvérise tout : environ 70 millions d'exemplaires vendus, record absolu jamais égalé. Le clip de « Thriller », court métrage de 14 minutes avec zombies dansants réalisé par John Landis, révolutionne l'industrie du vidéoclip, tandis que le moonwalk dévoilé en 1983 stupéfie la planète. Michael Jackson devient le « roi de la pop », première mégastar noire de l'ère MTV, gantée de blanc et imitée dans le monde entier. Quarante ans plus tard, « Thriller » ressort chaque année à Halloween." }
    ],
    1983: [
      { t: "Le CD arrive en Europe",
        s: "Le disque compact débarque dans les bacs européens. Fini les craquements du vinyle, place au son numérique.",
        b: "En mars 1983, le Compact Disc, développé conjointement par Philips et Sony et lancé au Japon fin 1982, arrive officiellement en Europe et aux États-Unis. Ce petit disque argenté de 12 centimètres, lu par un laser, promet un son numérique parfait, sans craquement ni usure, et jusqu'à 74 minutes de musique, une durée choisie, dit la légende, pour contenir la 9e symphonie de Beethoven. D'abord cher et réservé aux audiophiles, le CD détrônera le vinyle et la cassette à la fin des années 1980 et régnera vingt ans sur la musique, avant d'être à son tour balayé par le MP3 puis le streaming." },
      { t: "Naissance officielle d'Internet",
        s: "Le réseau Arpanet bascule sur le protocole TCP/IP, langage commun qui donne officiellement naissance à Internet.",
        b: "Le 1er janvier 1983, le réseau Arpanet, ancêtre militaire et universitaire créé en 1969 aux États-Unis, bascule définitivement sur le protocole TCP/IP. Derrière ce nom technique se cache une idée simple et géniale : un langage commun permettant à tous les réseaux informatiques du monde de se parler entre eux, formant un « réseau des réseaux », internet. Cette date est considérée comme la naissance officielle d'Internet. Le grand public, lui, n'y aura accès que dans les années 1990 avec le World Wide Web et les premiers navigateurs. Aujourd'hui, plus de cinq milliards d'humains utilisent ce réseau né discrètement un 1er janvier." }
    ],
    1984: [
      { t: "Apple lance le Macintosh",
        s: "Apple présente le premier ordinateur grand public à souris et fenêtres. L'informatique devient conviviale.",
        b: "Le 24 janvier 1984, Steve Jobs présente le Macintosh, premier ordinateur grand public piloté à la souris avec des fenêtres et des icônes, une interface graphique qui rompt avec les lignes de commande obscures. Deux jours plus tôt, pendant le Super Bowl, Apple avait diffusé « 1984 », publicité mythique réalisée par Ridley Scott, où une athlète fracasse l'écran de Big Brother, allusion à peine voilée au géant IBM. Le Mac impose l'idée que l'ordinateur doit être simple, beau et accessible à tous. Cette philosophie guidera Apple jusqu'à l'iPhone, et l'interface fenêtres-icônes-souris règne encore sur tous nos écrans." },
      { t: "Jeux olympiques de Los Angeles",
        s: "Des JO ultra-commerciaux, boycottés par l'URSS, où Carl Lewis remporte quatre médailles d'or.",
        b: "À l'été 1984, Los Angeles accueille des Jeux olympiques qui marquent un tournant : boycottés par l'URSS et le bloc de l'Est en représailles du boycott américain de Moscou en 1980, ils sont les premiers Jeux massivement financés par le privé et les sponsors, et dégagent des bénéfices records. Sur la piste, l'Américain Carl Lewis réalise l'exploit d'égaler Jesse Owens avec quatre médailles d'or : 100 mètres, 200 mètres, relais et saut en longueur. Ces Jeux du show à l'américaine inventent le modèle économique de l'olympisme moderne, pour le meilleur, la viabilité financière, et pour le pire, la dérive commerciale." },
      { t: "Lancement de Canal+",
        s: "La première chaîne payante et cryptée de France émet pour la première fois. Cinéma, sport... et image brouillée.",
        b: "Le 4 novembre 1984, Canal+ commence à émettre : c'est la première chaîne de télévision privée et payante de France, et la quatrième chaîne tout court. Son concept fait sourire les sceptiques, payer pour la télévision ? Mais son cocktail cinéma récent, football en exclusivité et programmes en clair impertinents, avec plus tard « Nulle part ailleurs » et les Guignols de l'info, en fait un phénoménal succès et un empire. Des générations de Français garderont le souvenir de l'image cryptée qu'on essayait de deviner « en brouillé ». Canal+ transformera durablement le financement du cinéma français et la retransmission du sport." }
    ],
    1985: [
      { t: "Coluche crée les Restos du Cœur",
        s: "« J'ai une petite idée comme ça... » : Coluche lance les Restos du Cœur à la radio. Ils servent aujourd'hui des millions de repas.",
        b: "Le 26 septembre 1985, sur Europe 1, Coluche lance une idée : « un resto qui aurait comme ambition, au départ, de distribuer deux ou trois mille couverts par jour » gratuitement pour ceux qui ont faim. L'appel de l'humoriste le plus populaire de France déclenche un élan national : les premiers Restos du Cœur ouvrent en décembre 1985 et servent 8,5 millions de repas dès le premier hiver. Coluche mourra en juin 1986 dans un accident de moto, mais son idée lui survit : les Restos servent aujourd'hui plus de 150 millions de repas par an, et les Enfoirés chantent chaque année à leur profit." },
      { t: "Découverte du trou dans la couche d'ozone",
        s: "Des scientifiques révèlent un trou géant dans la couche d'ozone au-dessus de l'Antarctique. Le monde réagira... et réussira.",
        b: "En mai 1985, des scientifiques britanniques publient dans la revue Nature une découverte alarmante : chaque printemps, un trou géant s'ouvre dans la couche d'ozone au-dessus de l'Antarctique, ce bouclier qui protège la vie des ultraviolets du Soleil. Les coupables sont identifiés : les gaz CFC de nos bombes aérosols et réfrigérateurs. Fait rarissime, le monde réagit vite et ensemble : le protocole de Montréal, signé en 1987, interdit progressivement ces gaz. Résultat, la couche d'ozone se referme lentement et devrait être reconstituée vers le milieu du siècle. C'est à ce jour le plus grand succès de la coopération environnementale mondiale." }
    ],
    1986: [
      { t: "Catastrophe de Tchernobyl",
        s: "Un réacteur nucléaire explose en Ukraine soviétique. Le nuage radioactif traverse l'Europe... sans s'arrêter aux frontières.",
        b: "Le 26 avril 1986, le réacteur numéro 4 de la centrale de Tchernobyl, en Ukraine soviétique, explose lors d'un test de sécurité mal conduit. C'est la pire catastrophe nucléaire de l'histoire : un nuage radioactif traverse l'Europe, des centaines de milliers de « liquidateurs » sont envoyés au sacrifice, la ville voisine de Pripiat est évacuée pour toujours. L'URSS tente d'abord de cacher l'accident, révélé par des capteurs suédois. En France, un discours officiel lénifiant laissera la légende du nuage « arrêté à la frontière ». Tchernobyl ébranle la confiance dans le nucléaire et, en fragilisant le régime soviétique, contribue à sa chute." },
      { t: "Explosion de la navette Challenger",
        s: "La navette américaine explose en direct 73 secondes après le décollage, avec une institutrice à son bord.",
        b: "Le 28 janvier 1986, la navette spatiale américaine Challenger explose 73 secondes après son décollage, en direct devant des millions de téléspectateurs, dont de très nombreux enfants : à son bord se trouvait Christa McAuliffe, une institutrice qui devait donner des cours depuis l'espace. Les sept astronautes sont tués. La cause : un joint défaillant sur un propulseur, fragilisé par le froid, un risque connu des ingénieurs mais ignoré par la hiérarchie pressée de lancer. Le programme des navettes est suspendu presque trois ans. Le physicien Richard Feynman démontrera le problème d'un geste célèbre, en plongeant un joint dans un verre d'eau glacée." }
    ],
    1987: [
      { t: "Zelda arrive sur les consoles",
        s: "« The Legend of Zelda » sort sur NES en Occident. Link, Zelda et Hyrule entrent dans la légende du jeu vidéo.",
        b: "En 1987, les joueurs européens et américains découvrent sur la console NES de Nintendo « The Legend of Zelda », créé par Shigeru Miyamoto, déjà père de Mario. Révolutionnaire, le jeu propose un monde ouvert à explorer librement, des donjons, des secrets partout, et même une pile dans la cartouche pour sauvegarder sa partie, une première. Le héros Link, la princesse Zelda et le royaume d'Hyrule deviennent l'une des sagas les plus vénérées du jeu vidéo, dont chaque épisode majeur, d'« Ocarina of Time » à « Breath of the Wild » et « Tears of the Kingdom », est salué comme un chef-d'œuvre." },
      { t: "Krach boursier d'octobre 1987",
        s: "Le « lundi noir » : Wall Street s'effondre de 22,6 % en une seule journée, le pire krach de l'histoire moderne.",
        b: "Le 19 octobre 1987, Wall Street vit son « lundi noir » : l'indice Dow Jones s'effondre de 22,6 % en une seule séance, la pire chute journalière de son histoire, pire encore qu'en 1929. La panique se propage instantanément à toutes les places mondiales, Paris, Londres, Tokyo. Fait nouveau, les programmes informatiques de vente automatique amplifient la dégringolade : c'est le premier krach de l'ère de l'ordinateur. Contrairement à 1929, les banques centrales inondent le marché de liquidités et la crise économique redoutée n'aura pas lieu, les bourses se redressant en quelques mois. L'épisode inspirera des garde-fous, les « coupe-circuits », toujours en vigueur." }
    ],
    1988: [
      { t: "Jeux olympiques de Séoul",
        s: "Les JO de Séoul, marqués par le scandale Ben Johnson, contrôlé positif après son 100 mètres stratosphérique.",
        b: "En septembre 1988, Séoul accueille des Jeux olympiques qui consacrent le retour de presque toutes les nations après trois olympiades de boycotts. La Corée du Sud, dictature militaire quelques mois plus tôt, y affiche sa démocratisation et son miracle économique. Mais l'histoire retient surtout le scandale du siècle : le Canadien Ben Johnson pulvérise le record du monde du 100 mètres en 9 secondes 79 devant Carl Lewis, avant d'être contrôlé positif aux stéroïdes trois jours plus tard, déchu et renvoyé chez lui dans l'opprobre. Ce séisme ouvre l'ère de la lutte antidopage moderne. La nageuse Kristin Otto y remporte, elle, six médailles d'or." },
      { t: "Création du RMI",
        s: "La France crée le revenu minimum d'insertion, un filet de sécurité pour les plus démunis. L'ancêtre du RSA.",
        b: "Le 1er décembre 1988, l'Assemblée nationale vote à la quasi-unanimité la création du revenu minimum d'insertion, promesse de campagne de François Mitterrand réélu quelques mois plus tôt. Le RMI garantit un revenu minimal, environ 2 000 francs par mois pour une personne seule à l'époque, à ceux qui n'ont plus droit à rien, en échange d'une démarche d'insertion. C'est une petite révolution dans la protection sociale française : reconnaître que la société doit un minimum vital à chacun, même sans emploi. Un million d'allocataires seront atteints dès 1993. Le RMI sera remplacé en 2009 par le RSA, sur le même principe." }
    ],
    1989: [
      { t: "Chute du mur de Berlin",
        s: "Dans la nuit du 9 novembre, les Berlinois franchissent et démolissent le mur. La guerre froide touche à sa fin.",
        b: "Le 9 novembre 1989 au soir, un porte-parole est-allemand annonce, un peu confusément, que les voyages vers l'Ouest sont libres « immédiatement ». En quelques heures, des dizaines de milliers de Berlinois de l'Est convergent vers le mur ; les gardes-frontières, débordés et sans ordres, ouvrent les barrières. Des inconnus s'embrassent, on danse sur le mur, on l'attaque au marteau et au burin. Après 28 ans de séparation, de familles coupées en deux et d'évasions tragiques, le symbole de la guerre froide tombe sans un coup de feu. Moins d'un an plus tard, l'Allemagne est réunifiée, et en 1991 l'URSS elle-même disparaît." },
      { t: "Répression de la place Tian'anmen",
        s: "À Pékin, l'armée écrase dans le sang le mouvement étudiant pour la démocratie. L'image de « l'homme au char » fait le tour du monde.",
        b: "Au printemps 1989, des centaines de milliers d'étudiants et d'ouvriers chinois occupent la place Tian'anmen, au cœur de Pékin, pour réclamer démocratie et fin de la corruption. Dans la nuit du 3 au 4 juin, le pouvoir communiste envoie l'armée et les chars : le mouvement est écrasé dans le sang, avec un bilan, toujours censuré, estimé de plusieurs centaines à plusieurs milliers de morts. Le lendemain, un homme seul, deux sacs à la main, arrête une colonne de chars : cette image devient l'une des photos les plus célèbres du siècle. En Chine, l'événement reste aujourd'hui totalement effacé de l'histoire officielle." },
      { t: "Sortie du Game Boy",
        s: "Nintendo lance sa console portable à l'écran verdâtre, vendue avec Tetris. Un carton planétaire.",
        b: "En avril 1989 au Japon, Nintendo lance le Game Boy, une console de jeu qui tient dans la poche, avec son petit écran aux nuances de vert et ses quatre boutons. Face à des concurrentes techniquement bien supérieures, elle gagne grâce à son prix, son autonomie record et un coup de génie : elle est vendue avec Tetris, le casse-tête soviétique hypnotique qui séduit bien au-delà des joueurs habituels. Avec Mario, Zelda puis l'ouragan Pokémon en 1996, le Game Boy et sa descendance s'écouleront à plus de 118 millions d'exemplaires, imposant Nintendo comme le roi du jeu portable, jusqu'à la Switch d'aujourd'hui." }
    ],
    1990: [
      { t: "Libération de Nelson Mandela",
        s: "Après 27 ans de prison, Mandela sort libre, poing levé. La fin de l'apartheid est en marche.",
        b: "Le 11 février 1990, Nelson Mandela franchit à pied, poing levé, les grilles de la prison de Victor Verster, en Afrique du Sud. Le monde découvre en direct le visage vieilli du prisonnier politique le plus célèbre de la planète, incarcéré depuis 27 ans pour son combat contre l'apartheid, le régime de ségrégation raciale. Plutôt que la vengeance, Mandela choisit la négociation avec le président de Klerk : l'apartheid est démantelé, les deux hommes reçoivent le prix Nobel de la paix en 1993, et en 1994 Mandela est élu président lors des premières élections multiraciales du pays. Un destin devenu symbole universel de réconciliation." },
      { t: "Début de la guerre du Golfe",
        s: "L'Irak de Saddam Hussein envahit le Koweït. Une coalition internationale se prépare à riposter.",
        b: "Le 2 août 1990, l'armée irakienne de Saddam Hussein envahit en quelques heures le Koweït, petit émirat pétrolier voisin. La communauté internationale, dans un rare consensus de l'après-guerre froide, condamne l'annexion : l'ONU vote un embargo puis un ultimatum, tandis qu'une coalition de 35 pays menée par les États-Unis, et incluant la France, masse des centaines de milliers de soldats en Arabie saoudite. En janvier 1991, l'opération « Tempête du désert » libérera le Koweït en quelques semaines, avec ses images de guerre en direct sur CNN, une première. Saddam Hussein, lui, restera au pouvoir jusqu'à l'invasion américaine de 2003." }
    ],
    1991: [
      { t: "Fin de l'URSS",
        s: "Le drapeau rouge est amené au Kremlin le 25 décembre. L'Union soviétique n'existe plus, la guerre froide est finie.",
        b: "Le 25 décembre 1991 au soir, le drapeau rouge frappé de la faucille et du marteau est amené du Kremlin : Mikhaïl Gorbatchev démissionne et l'Union soviétique cesse d'exister, remplacée par quinze républiques indépendantes, dont la Russie de Boris Eltsine. L'empire né de la révolution de 1917, vainqueur du nazisme, puissance nucléaire et spatiale rivale de l'Amérique, s'est effondré en deux ans sous le poids de la faillite économique, des nationalismes et des réformes de Gorbatchev, la perestroïka et la glasnost, qui devaient le sauver. La guerre froide s'achève sans bataille finale. Les États-Unis restent seuls au sommet, du moins pour un temps." },
      { t: "Le Web devient public",
        s: "Tim Berners-Lee ouvre le World Wide Web au monde entier. Les fameux « www » vont changer nos vies.",
        b: "Le 6 août 1991, Tim Berners-Lee, chercheur britannique au CERN, à Genève, met en ligne le tout premier site web et annonce publiquement son invention : le World Wide Web. Son idée, des pages reliées entre elles par des liens hypertextes et accessibles via une adresse en « www », transforme Internet, jusque-là réservé aux initiés, en un espace que tout le monde pourra bientôt parcourir. Geste décisif : le CERN renonce à tout droit sur l'invention, offerte gratuitement à l'humanité en 1993. Sans cette décision, pas de sites, pas de navigateurs, pas de e-commerce ni de réseaux sociaux. Le monde moderne tient à ce cadeau." }
    ],
    1992: [
      { t: "Jeux olympiques de Barcelone",
        s: "Barcelone accueille des Jeux grandioses, avec la « Dream Team » américaine de basket, la plus grande équipe jamais réunie.",
        b: "À l'été 1992, Barcelone organise des Jeux olympiques restés parmi les plus réussis de l'histoire, transformant la ville catalane, son front de mer et son image pour toujours. Ce sont les premiers Jeux sans boycott depuis vingt ans, avec le retour de l'Afrique du Sud post-apartheid et une équipe unifiée de l'ex-URSS. L'attraction planétaire, c'est la « Dream Team » : pour la première fois, les stars de la NBA, Michael Jordan, Magic Johnson, Larry Bird, disputent les JO. Considérée comme la plus grande équipe de l'histoire du sport, elle écrase le tournoi avec 44 points d'écart en moyenne et mondialise définitivement le basket." },
      { t: "Ouverture d'Euro Disney",
        s: "Le parc Disney ouvre à Marne-la-Vallée au milieu des polémiques. Il deviendra la première destination touristique d'Europe.",
        b: "Le 12 avril 1992, Euro Disney ouvre ses portes à Marne-la-Vallée, à trente kilomètres de Paris. L'arrivée de Mickey en France déchaîne les passions : des intellectuels dénoncent un « Tchernobyl culturel », les débuts sont difficiles, fréquentation décevante, pertes financières abyssales, personnel en grève contre le code vestimentaire. Rebaptisé Disneyland Paris en 1994 et renfloué à plusieurs reprises, le parc finit pourtant par s'imposer : avec son deuxième parc consacré au cinéma ouvert en 2002, il devient la première destination touristique privée d'Europe, avec environ quinze millions de visiteurs par an, loin devant la tour Eiffel et le Louvre." },
      { t: "Le premier SMS de l'histoire",
        s: "Un ingénieur envoie le tout premier SMS : « Merry Christmas ». Le texto va révolutionner nos conversations.",
        b: "Le 3 décembre 1992, au Royaume-Uni, l'ingénieur Neil Papworth envoie depuis son ordinateur le premier SMS de l'histoire vers le téléphone portable d'un cadre de l'opérateur Vodafone. Le message tient en deux mots : « Merry Christmas ». Personne n'imagine alors le raz-de-marée : pensé comme un gadget technique limité à 160 caractères, le « texto » explose à la fin des années 1990, notamment chez les jeunes qui inventent leur propre langage abrégé. Au sommet, plusieurs milliers de milliards de SMS s'échangent chaque année dans le monde, avant que WhatsApp, Messenger et autres applications ne prennent le relais. Le premier SMS a été vendu aux enchères en 2021, sous forme de NFT." }
    ],
    1993: [
      { t: "« Jurassic Park » ressuscite les dinosaures",
        s: "Spielberg fait revivre les dinosaures grâce aux images de synthèse. Le cinéma entre dans l'ère numérique.",
        b: "En 1993, Steven Spielberg adapte le roman de Michael Crichton : « Jurassic Park », l'histoire d'un parc d'attractions peuplé de dinosaures recréés à partir d'ADN fossile. Pour la première fois, des créatures entièrement générées par ordinateur partagent l'écran avec des acteurs de manière photoréaliste, en complément d'animatroniques géants. Le tyrannosaure sous la pluie et les vélociraptors dans la cuisine terrifient la planète : le film devient le plus gros succès de l'histoire à sa sortie et lance l'ère des effets numériques, qui transformera tout le cinéma. La saga se poursuit encore trente ans plus tard, et la question demeure : faut-il ressusciter ce que l'évolution a éteint ?" },
      { t: "Le traité de Maastricht entre en vigueur",
        s: "L'Union européenne naît officiellement, avec la promesse d'une monnaie unique : le futur euro.",
        b: "Le 1er novembre 1993, le traité de Maastricht entre en vigueur : la Communauté économique européenne devient l'Union européenne. Ce traité, que les Français avaient approuvé par référendum en septembre 1992 à une courte majorité de 51 %, après une campagne passionnée, crée une citoyenneté européenne, renforce les pouvoirs du Parlement européen et surtout programme la monnaie unique, le futur euro, avec ses fameux « critères de convergence » sur les déficits et la dette. C'est l'acte fondateur de l'Europe actuelle, celle dans laquelle on voyage sans changer d'argent, et le point de départ de nombreux débats sur la souveraineté qui animent encore la politique française." }
    ],
    1994: [
      { t: "Génocide des Tutsis au Rwanda",
        s: "En cent jours, environ 800 000 personnes sont massacrées au Rwanda, dans l'indifférence de la communauté internationale.",
        b: "D'avril à juillet 1994, le Rwanda bascule dans l'horreur : après l'attentat contre l'avion du président Habyarimana, le pouvoir extrémiste hutu déclenche l'extermination planifiée de la minorité tutsie. En une centaine de jours, environ 800 000 personnes, hommes, femmes, enfants, sont massacrées, souvent à la machette, par les milices et une partie de la population, encouragées par la sinistre Radio Mille Collines. La communauté internationale, ONU en tête, regarde ailleurs et retire même ses casques bleus. C'est l'un des génocides les plus rapides de l'histoire. Le rôle de la France, alliée du régime hutu, fait toujours l'objet de débats et de travaux d'historiens." },
      { t: "Ouverture du tunnel sous la Manche",
        s: "Après deux siècles de rêves, on passe enfin sous la Manche en train. Londres n'est plus qu'à quelques heures de Paris.",
        b: "Le 6 mai 1994, la reine Élisabeth II et le président François Mitterrand inaugurent le tunnel sous la Manche, concrétisant un rêve vieux de deux siècles, Napoléon y songeait déjà. Long de 50 kilomètres, dont 38 sous la mer, creusé en sept ans par des tunneliers géants partis des deux rives pour se rejoindre au millimètre, c'est l'un des plus grands chantiers du 20e siècle. L'Eurostar met bientôt Londres à trois heures de Paris, puis à 2h15, tandis que les navettes embarquent voitures et camions. Malgré des débuts financiers calamiteux, le « Chunnel » transporte désormais plus de vingt millions de passagers par an. L'Angleterre n'est plus une île." }
    ],
    1995: [
      { t: "Vague d'attentats à Paris",
        s: "Une série d'attentats islamistes frappe la France, dont celui du RER Saint-Michel qui fait 8 morts.",
        b: "À l'été et à l'automne 1995, la France est frappée par une vague d'attentats commis par le GIA, le Groupe islamique armé algérien, qui reproche à Paris son soutien au gouvernement d'Alger. Le plus meurtrier, le 25 juillet, vise le RER B à la station Saint-Michel : une bonbonne de gaz bourrée d'écrous explose, tuant 8 personnes et en blessant près de 150. Suivent d'autres explosions, place de l'Étoile, dans le métro, sur un marché, ainsi qu'une bombe désamorcée sur une ligne TGV dont les empreintes permettent d'identifier Khaled Kelkal, abattu par les gendarmes en direct à la télévision en septembre. Le plan Vigipirate est activé, les poubelles publiques scellées. La France découvre le terrorisme islamiste sur son sol." },
      { t: "Sortie de Windows 95",
        s: "Microsoft lance Windows 95 dans un show planétaire. L'ordinateur familial devient un phénomène de masse.",
        b: "Le 24 août 1995, Microsoft lance Windows 95 avec un marketing jamais vu pour un logiciel : files d'attente à minuit devant les magasins, hymne des Rolling Stones « Start Me Up » payé à prix d'or, shows télévisés. Avec son bouton Démarrer, sa barre des tâches et sa gestion simplifiée, Windows 95 rend l'ordinateur enfin accessible au grand public et se vend à des dizaines de millions d'exemplaires en quelques mois. C'est le moment où le PC entre massivement dans les foyers et les bureaux, avec le CD-ROM et bientôt Internet. L'interface inventée alors, Démarrer, fenêtres, corbeille, structure encore les ordinateurs d'aujourd'hui." },
      { t: "Jacques Chirac élu président",
        s: "Après deux échecs, Jacques Chirac est élu président sur le thème de la « fracture sociale ».",
        b: "Le 7 mai 1995, Jacques Chirac est élu président de la République avec 52,6 % des voix face au socialiste Lionel Jospin, au terme d'une campagne où il a d'abord dû éliminer son « ami de trente ans » Édouard Balladur, dont la candidature avait déchiré la droite. Après ses défaites de 1981 et 1988, le maire de Paris accède enfin à l'Élysée, en ayant fait campagne sur la « fracture sociale ». Son premier mandat sera marqué par la reprise des essais nucléaires, les grandes grèves de décembre 1995, la reconnaissance de la responsabilité de la France dans la rafle du Vel d'Hiv, et la dissolution ratée de 1997. Réélu en 2002, il restera douze ans au pouvoir." }
    ],
    1996: [
      { t: "Crise de la vache folle",
        s: "Le Royaume-Uni admet que la maladie de la vache folle peut toucher l'homme. Panique dans les assiettes européennes.",
        b: "Le 20 mars 1996, le gouvernement britannique admet l'impensable : la maladie de la « vache folle », une infection du cerveau des bovins apparue dans les années 1980 et propagée par les farines animales, des vaches nourries avec des restes de vaches, peut se transmettre à l'homme sous la forme d'une variante mortelle de la maladie de Creutzfeldt-Jakob. La panique s'empare de l'Europe : embargo sur le bœuf britannique, effondrement de la consommation, abattage de millions de bovins, images de bûchers de carcasses. La crise, qui fera environ 230 victimes humaines dont une trentaine en France, transforme durablement la sécurité alimentaire et la traçabilité de la viande." },
      { t: "Pokémon voit le jour",
        s: "Les premiers jeux Pokémon sortent au Japon sur Game Boy. Pikachu s'apprête à conquérir la planète.",
        b: "Le 27 février 1996 sortent au Japon « Pokémon Version Rouge » et « Version Verte » sur Game Boy, aboutissement de six ans de travail de Satoshi Tajiri, inspiré par sa passion d'enfant pour la chasse aux insectes. Le concept, capturer, échanger via un câble et faire combattre 151 créatures, avec le slogan « Attrapez-les tous », déclenche un phénomène sans équivalent. Dessin animé porté par Pikachu, cartes à collectionner qui rendent folles les cours de récré, films, peluches : Pokémon devient la licence de divertissement la plus lucrative de l'histoire, devant Star Wars et Mickey, et fait toujours courir les foules, comme l'a prouvé Pokémon Go en 2016." },
      { t: "Dolly, premier mammifère cloné",
        s: "En Écosse naît Dolly la brebis, premier mammifère cloné à partir d'une cellule adulte. Le monde s'interroge.",
        b: "Le 5 juillet 1996 naît en Écosse une brebis pas comme les autres : Dolly, premier mammifère de l'histoire cloné à partir d'une cellule d'un animal adulte. Les chercheurs de l'institut Roslin ont transféré le noyau d'une cellule de glande mammaire d'une brebis de six ans dans un ovule vidé de son ADN : Dolly est donc la copie génétique de sa « mère ». Révélée au public en février 1997, elle fait la une du monde entier et déclenche un immense débat éthique : clonera-t-on un jour des humains ? Dolly vivra six ans et demi, aura des agneaux, et trône désormais empaillée au musée national d'Écosse." }
    ],
    1997: [
      { t: "Mort de Lady Diana",
        s: "La princesse Diana meurt dans un accident de voiture sous le pont de l'Alma, à Paris. Émotion planétaire sans précédent.",
        b: "Dans la nuit du 31 août 1997, la princesse Diana, 36 ans, meurt dans un accident de voiture sous le pont de l'Alma, à Paris, avec son compagnon Dodi Al-Fayed, leur Mercedes poursuivie par des paparazzis s'écrasant contre un pilier du tunnel. La mort de la « princesse des cœurs », divorcée du prince Charles et adulée pour son engagement humanitaire, provoque une émotion planétaire inédite : océans de fleurs devant Kensington Palace, monarchie britannique ébranlée par sa froideur initiale, funérailles suivies par environ deux milliards de téléspectateurs, où Elton John chante « Candle in the Wind ». Son souvenir hante encore la famille royale et la presse people." },
      { t: "Publication du premier Harry Potter",
        s: "Une inconnue nommée J.K. Rowling publie « Harry Potter à l'école des sorciers ». La plus grande saga littéraire moderne commence.",
        b: "Le 26 juin 1997 paraît au Royaume-Uni, à 500 exemplaires seulement, « Harry Potter à l'école des sorciers », premier roman d'une mère célibataire fauchée qui l'a écrit dans des cafés d'Édimbourg : J.K. Rowling. Refusé par une douzaine d'éditeurs, le livre raconte l'histoire d'un orphelin qui découvre qu'il est sorcier et entre au collège de Poudlard. Le bouche-à-oreille fait le reste : la saga en sept tomes s'écoulera à plus de 500 millions d'exemplaires, traduite en 80 langues, réconciliant toute une génération avec la lecture. Les huit films, les pièces, les parcs d'attractions en feront l'un des univers les plus lucratifs de la culture mondiale." }
    ],
    1998: [
      { t: "La France championne du monde",
        s: "Zidane, deux coups de tête en finale, la France bat le Brésil 3 à 0. Un million de personnes sur les Champs-Élysées.",
        b: "Le 12 juillet 1998, au Stade de France, l'équipe de France remporte « sa » Coupe du monde en battant le Brésil de Ronaldo 3 à 0 en finale : deux coups de tête de Zinédine Zidane, un but d'Emmanuel Petit, et le commentaire de Thierry Roland, « Après avoir vu ça, on peut mourir tranquille ». Le soir même, plus d'un million de personnes envahissent les Champs-Élysées, du jamais vu depuis la Libération, et le visage de Zidane est projeté sur l'Arc de Triomphe. L'équipe « black-blanc-beur » d'Aimé Jacquet, moquée avant le tournoi, devient le symbole d'une France qui gagne unie. Vingt ans plus tard, les Bleus décrocheront la deuxième étoile." },
      { t: "Naissance de Google",
        s: "Deux étudiants de Stanford fondent Google dans un garage. Leur moteur de recherche va organiser le savoir mondial.",
        b: "Le 4 septembre 1998, deux doctorants de Stanford, Larry Page et Sergueï Brin, fondent Google dans un garage de Californie. Leur idée : classer les pages web non pas au hasard, mais selon leur popularité mesurée par les liens qui pointent vers elles, un algorithme baptisé PageRank. Le moteur, au design d'une sobriété inédite, écrase vite la concurrence par la pertinence de ses résultats. « Googler » devient un verbe, l'entreprise avale YouTube, crée Android, Maps et Gmail, et sa maison mère Alphabet pèse aujourd'hui des milliers de milliards de dollars. Le garage de Menlo Park a rejoint celui d'Apple dans la mythologie de la Silicon Valley." }
    ],
    1999: [
      { t: "Naissance de l'euro",
        s: "L'euro devient la monnaie officielle de onze pays, d'abord sur les comptes en banque. Les billets attendront 2002.",
        b: "Le 1er janvier 1999, l'euro naît officiellement : onze pays de l'Union européenne, dont la France et l'Allemagne, adoptent la monnaie unique prévue par le traité de Maastricht. Pendant trois ans, l'euro n'existe que sous forme « scripturale », sur les comptes bancaires, les chèques et les marchés financiers, tandis que les francs continuent de circuler, avec le fameux taux gravé dans les mémoires : 6,55957 francs pour un euro. Les pièces et billets n'arriveront dans les poches que le 1er janvier 2002. C'est l'aboutissement de cinquante ans de construction européenne, et le plus grand changement monétaire de l'histoire en temps de paix." },
      { t: "Éclipse totale de Soleil en France",
        s: "Le 11 août, la France vit en plein jour une nuit de deux minutes. Des millions de lunettes en carton sur les nez.",
        b: "Le 11 août 1999, une éclipse totale de Soleil traverse le nord de la France, de la Normandie à l'Alsace, un spectacle que la métropole n'avait pas vu depuis 1961 et ne reverra pas avant 2081. À midi, la Lune recouvre entièrement le Soleil : la nuit tombe en plein jour pendant environ deux minutes, la température chute, les oiseaux se taisent. Des millions de personnes, lunettes de carton spéciales sur le nez, contemplent le ciel, malgré une météo capricieuse et nuageuse sur une partie du parcours. Ce fut probablement l'éclipse la plus observée de l'histoire, sa bande de totalité traversant l'Europe densément peuplée jusqu'en Turquie." }
    ],
    2000: [
      { t: "Passage au nouveau millénaire",
        s: "La planète fête l'an 2000 en une gigantesque vague de feux d'artifice, de Sydney à Paris, où la tour Eiffel scintille.",
        b: "Dans la nuit du 31 décembre 1999 au 1er janvier 2000, l'humanité fête son changement de millénaire en direct à la télévision, fuseau horaire après fuseau horaire : feux d'artifice pharaoniques à Sydney, au Caire, à New York, et à Paris où la tour Eiffel, équipée pour l'occasion de ses 20 000 flashs, se met à scintiller, un spectacle prévu pour un an... et jamais arrêté depuis. Les puristes rappellent que le 21e siècle ne commence mathématiquement qu'en 2001, mais personne n'attend : « l'an 2000 », horizon de toutes les anticipations du 20e siècle, voitures volantes comprises, est enfin là." },
      { t: "Le bug de l'an 2000",
        s: "Le monde retient son souffle : les ordinateurs vont-ils planter au passage à l'an 2000 ? Finalement, presque rien.",
        b: "À l'approche du 1er janvier 2000, une angoisse technologique saisit la planète : le « bug de l'an 2000 ». Beaucoup de programmes informatiques anciens codaient les années sur deux chiffres, 99 pour 1999 ; au passage à 00, allaient-ils croire revenir en 1900 et tout dérégler, des banques aux centrales électriques, voire aux avions ? Des centaines de milliards de dollars sont dépensés dans le monde pour vérifier et corriger les systèmes, des cellules de crise veillent la nuit du réveillon... et il ne se passe presque rien. On débat encore : catastrophe évitée grâce au travail des informaticiens, ou grande peur exagérée ?" }
    ],
    2001: [
      { t: "Attentats du 11 septembre",
        s: "Des avions détournés percutent les tours jumelles de New York et le Pentagone. Près de 3 000 morts, le monde bascule.",
        b: "Le 11 septembre 2001, dix-neuf terroristes d'Al-Qaïda détournent quatre avions de ligne américains. Deux percutent les tours jumelles du World Trade Center à New York, qui s'effondrent en direct devant des milliards de téléspectateurs, un troisième frappe le Pentagone, le quatrième s'écrase en Pennsylvanie après la révolte des passagers. Bilan : près de 3 000 morts. C'est l'attentat le plus meurtrier de l'histoire, et un basculement du monde : « guerre contre le terrorisme », invasion de l'Afghanistan dès octobre, puis de l'Irak en 2003, renforcement drastique de la sécurité aérienne. Oussama ben Laden, commanditaire, sera tué par les Américains en 2011." },
      { t: "Lancement de Wikipédia",
        s: "Une encyclopédie gratuite que chacun peut modifier ? L'idée paraît folle. Elle devient l'un des sites les plus consultés au monde.",
        b: "Le 15 janvier 2001, Jimmy Wales et Larry Sanger lancent Wikipédia, une encyclopédie en ligne gratuite, sans publicité, et surtout modifiable par n'importe qui. L'idée semble vouée au chaos : comment des anonymes non payés produiraient-ils un savoir fiable ? Contre toute attente, la communauté s'autorégule, source ses articles, corrige les vandalismes en quelques minutes. Vingt-cinq ans plus tard, Wikipédia compte plus de 60 millions d'articles dans plus de 300 langues, dont plus de 2,5 millions en français, et figure parmi les sites les plus consultés de la planète. Un des rares géants du web à but non lucratif, financé par les dons." },
      { t: "Loft Story, la téléréalité arrive en France",
        s: "Onze inconnus enfermés dans un loft, filmés 24h/24 : la France découvre la téléréalité, entre fascination et scandale.",
        b: "Le 26 avril 2001, M6 lance Loft Story : onze jeunes inconnus enfermés 70 jours dans un loft truffé de caméras, filmés 24 heures sur 24, éliminés au fil des semaines par le vote du public. La France s'enflamme : audiences record, une du journal de 20 heures, manifestations devant le loft aux cris de « TF1 aussi ça pourrit les cerveaux », débats enflammés d'intellectuels sur la « télé poubelle », et la fameuse scène de la piscine entre Loana et Jean-Édouard. Loana et Christophe l'emportent. La téléréalité s'installe durablement dans le paysage français : Star Academy, Koh-Lanta, Secret Story et tant d'autres suivront." }
    ],
    2002: [
      { t: "L'euro dans les poches",
        s: "Le 1er janvier, les pièces et billets en euros remplacent les francs. Toute une gymnastique mentale commence.",
        b: "Le 1er janvier 2002 à minuit, environ 300 millions d'Européens de douze pays commencent à payer leur baguette et leur café en euros : les pièces et billets de la monnaie unique entrent en circulation, l'un des plus grands basculements logistiques de l'histoire en temps de paix. En France, le franc, vieux de plus de six siècles, tire sa révérence après une courte période de double circulation. Les Français convertissent tout de tête, 6,55957 francs pour un euro, et beaucoup continueront des années à « penser en francs » pour les grosses sommes, quand ce n'est pas en anciens francs. Le sentiment que « tout a augmenté » alimentera durablement le débat." },
      { t: "Le séisme du 21 avril",
        s: "Jean-Marie Le Pen élimine Lionel Jospin et se qualifie pour le second tour de la présidentielle. La France est sous le choc.",
        b: "Le 21 avril 2002 à 20 heures, la France politique vit un tremblement de terre : Jean-Marie Le Pen, président du Front national, se qualifie pour le second tour de l'élection présidentielle avec 16,9 % des voix, éliminant le Premier ministre socialiste Lionel Jospin, victime notamment de l'éparpillement record de la gauche entre huit candidats. Dans les jours qui suivent, des millions de personnes, beaucoup de lycéens, manifestent dans toute la France. Au second tour, Jacques Chirac est réélu avec 82 % des voix, le score le plus élevé de l'histoire, beaucoup d'électeurs de gauche votant « avec des pincettes ». Le 21 avril devient une date-symbole de la vie politique française." }
    ],
    2003: [
      { t: "Canicule meurtrière en Europe",
        s: "L'été 2003 écrase la France sous une chaleur historique : près de 15 000 morts, surtout des personnes âgées isolées.",
        b: "En août 2003, une canicule d'une intensité jamais vue s'abat sur l'Europe de l'Ouest. En France, les températures dépassent 40 degrés pendant des jours, les nuits ne rafraîchissent plus, et le drame se noue en silence : près de 15 000 morts en quelques semaines, essentiellement des personnes âgées isolées, au point que les chambres funéraires débordent. Le scandale est immense, le directeur général de la Santé démissionne, et le pays découvre la solitude de ses aînés. En réponse naissent le « plan canicule », le registre des personnes vulnérables et la journée de solidarité travaillée. La canicule de 2003 marque aussi la prise de conscience concrète du réchauffement climatique." },
      { t: "Guerre en Irak",
        s: "Les États-Unis envahissent l'Irak malgré l'opposition de la France, dont le « non » à l'ONU reste célèbre.",
        b: "Le 20 mars 2003, les États-Unis de George W. Bush et leurs alliés envahissent l'Irak, accusant Saddam Hussein de détenir des armes de destruction massive, qui ne seront jamais trouvées. Quelques semaines plus tôt, le ministre français Dominique de Villepin avait prononcé à l'ONU un discours resté célèbre contre la guerre, applaudi, fait rarissime, par le Conseil de sécurité ; la France de Chirac refuse de participer, provoquant la fureur américaine, jusqu'aux « freedom fries » remplaçant les « french fries ». Bagdad tombe en trois semaines, Saddam est capturé puis exécuté, mais le pays sombre dans un chaos durable dont naîtra plus tard l'État islamique." }
    ],
    2004: [
      { t: "Naissance de Facebook",
        s: "Dans sa chambre d'étudiant à Harvard, Mark Zuckerberg lance un trombinoscope en ligne. Les réseaux sociaux vont dévorer le monde.",
        b: "Le 4 février 2004, Mark Zuckerberg, étudiant de 19 ans à Harvard, lance depuis sa chambre « TheFacebook », un trombinoscope en ligne réservé au campus. Le site s'étend d'université en université, puis s'ouvre à tous en 2006. La suite est vertigineuse : le fil d'actualité, le bouton « J'aime », le rachat d'Instagram et de WhatsApp, plus de trois milliards d'utilisateurs, et une influence telle sur l'information et les élections que l'entreprise, rebaptisée Meta, est régulièrement convoquée devant les parlements du monde entier. L'idée d'exister en ligne, de « poster » sa vie et de compter ses amis est née là, dans une chambre d'étudiant." },
      { t: "Tsunami dans l'océan Indien",
        s: "Le 26 décembre, un séisme géant déclenche un tsunami qui fait environ 230 000 morts dans quatorze pays.",
        b: "Le 26 décembre 2004 au matin, un séisme de magnitude 9,1, l'un des plus puissants jamais enregistrés, rompt le plancher océanique au large de Sumatra, en Indonésie. Des vagues atteignant par endroits plus de 30 mètres déferlent sur les côtes de l'océan Indien, parfois plusieurs heures plus tard et sans aucun signe avant-coureur pour des populations non alertées : environ 230 000 morts en Indonésie, au Sri Lanka, en Inde, en Thaïlande, jusqu'aux côtes africaines. Parmi les victimes, des milliers de touristes en vacances de Noël. L'élan de solidarité mondiale est sans précédent, et un système d'alerte aux tsunamis est enfin déployé dans l'océan Indien." }
    ],
    2005: [
      { t: "Naissance de YouTube",
        s: "Trois anciens de PayPal lancent un site pour partager des vidéos. Premier clip : 19 secondes au zoo.",
        b: "Le 14 février 2005, trois anciens employés de PayPal, Chad Hurley, Steve Chen et Jawed Karim, déposent le nom YouTube. En avril, Karim met en ligne la première vidéo du site : « Me at the zoo », 19 secondes devant des éléphants. L'idée, partager des vidéos aussi simplement qu'un mail, explose : Google rachète le site dès 2006 pour 1,65 milliard de dollars, une somme jugée folle... et finalement dérisoire. YouTube devient le deuxième site le plus visité du monde, avec des milliards d'heures visionnées chaque jour, et invente un métier qui fait rêver les enfants : youtubeur. La télévision ne s'en remettra jamais tout à fait." },
      { t: "L'ouragan Katrina dévaste La Nouvelle-Orléans",
        s: "Katrina submerge La Nouvelle-Orléans : plus de 1 800 morts et une Amérique sidérée par sa propre impuissance.",
        b: "Fin août 2005, l'ouragan Katrina frappe le sud des États-Unis. À La Nouvelle-Orléans, ce ne sont pas tant les vents que la rupture des digues qui provoque la catastrophe : 80 % de la ville, construite sous le niveau de la mer, est inondée. Plus de 1 800 personnes meurent, des dizaines de milliers d'habitants, surtout pauvres et noirs, se retrouvent piégés sur les toits ou entassés dans le Superdome sans eau ni secours pendant des jours. Les images sidèrent le monde : la première puissance mondiale semble incapable de secourir sa propre population. Katrina reste l'une des pires catastrophes naturelles de l'histoire américaine." }
    ],
    2006: [
      { t: "Le coup de boule de Zidane",
        s: "Pour son dernier match, en finale de Coupe du monde, Zidane est expulsé après un coup de tête à Materazzi. L'Italie sacrée.",
        b: "Le 9 juillet 2006, à Berlin, Zinédine Zidane dispute le dernier match de sa carrière : la finale de la Coupe du monde contre l'Italie. Après une « panenka » d'anthologie sur penalty, le drame : à la 110e minute, provoqué par des insultes de Marco Materazzi visant sa famille, Zidane lui assène un coup de tête en pleine poitrine, sous les yeux du monde entier. Carton rouge, sortie tête basse devant la Coupe, et l'Italie qui l'emporte aux tirs au but. Cette image stupéfiante, statufiée depuis par un sculpteur, clôt tragiquement la carrière du plus grand joueur français et alimente des années de discussions : qu'a dit exactement Materazzi ?" },
      { t: "Les débuts de Twitter",
        s: "Un petit site propose de raconter sa vie en 140 caractères. Les politiques, les stars et les révolutions s'en empareront.",
        b: "Le 21 mars 2006, Jack Dorsey publie le premier message de l'histoire de Twitter : « just setting up my twttr ». Le concept, des messages publics de 140 caractères maximum, format hérité du SMS, semble futile ; il devient le système nerveux de la planète : les journalistes y traquent l'information en direct, les révolutions arabes s'y organisent, les stars y parlent sans filtre et Donald Trump en fera son arme de gouvernement. Le hashtag, le retweet et le « fil » entrent dans le langage courant. Racheté en 2022 par Elon Musk et rebaptisé X, le petit oiseau bleu aura changé pour toujours le rythme de l'information mondiale." }
    ],
    2007: [
      { t: "Apple présente l'iPhone",
        s: "Steve Jobs dévoile « un iPod, un téléphone et un navigateur Internet » dans un seul appareil. Le smartphone moderne est né.",
        b: "Le 9 janvier 2007, à San Francisco, Steve Jobs monte sur scène : « Aujourd'hui, Apple réinvente le téléphone. » Il présente un appareil sans clavier, tout tactile, réunissant « un iPod, un téléphone et un communicateur Internet » : l'iPhone. Les concurrents ricanent, Nokia et BlackBerry dominent le marché ; dix ans plus tard, ils auront quasiment disparu. Avec l'App Store lancé en 2008, l'iPhone invente l'économie des applications et impose le rectangle de verre que l'humanité consulte désormais des dizaines de fois par jour. Plus de deux milliards d'exemplaires vendus plus tard, c'est probablement le produit le plus rentable de l'histoire industrielle." },
      { t: "Nicolas Sarkozy élu président",
        s: "Nicolas Sarkozy bat Ségolène Royal et s'installe à l'Élysée en promettant la « rupture ».",
        b: "Le 6 mai 2007, Nicolas Sarkozy est élu président de la République avec 53 % des voix face à la socialiste Ségolène Royal, première femme qualifiée au second tour d'une présidentielle. Élu sur les thèmes du « travailler plus pour gagner plus » et de la rupture, l'hyperactif ministre de l'Intérieur détonne d'emblée : soirée de victoire au Fouquet's, vacances sur un yacht, mariage avec Carla Bruni... on parle de « présidence bling-bling ». Son quinquennat sera percuté par la crise financière de 2008, marqué par la réforme des retraites et le retour de la France dans le commandement de l'OTAN. Il sera battu par François Hollande en 2012." }
    ],
    2008: [
      { t: "Jeux olympiques de Pékin",
        s: "La Chine éblouit le monde avec des JO démesurés. Dans le bassin, Michael Phelps rafle huit médailles d'or.",
        b: "En août 2008, la Chine organise ses premiers Jeux olympiques et les transforme en démonstration de puissance : cérémonie d'ouverture hypnotique orchestrée au tambour près, stade « nid d'oiseau », moyens illimités. Le pays, critiqué sur les droits de l'homme et le Tibet jusque sur le parcours de la flamme, s'affirme comme la superpuissance du 21e siècle et termine en tête des médailles d'or. Côté sport, deux légendes explosent : le nageur américain Michael Phelps, huit titres en huit courses, record absolu pour une seule olympiade, et l'éclair jamaïcain Usain Bolt, qui pulvérise les records du 100 et du 200 mètres en se permettant de ralentir avant la ligne." },
      { t: "Crise financière mondiale",
        s: "La banque Lehman Brothers s'effondre, entraînant la pire crise économique depuis 1929.",
        b: "Le 15 septembre 2008, la banque d'affaires américaine Lehman Brothers, 158 ans d'existence, fait faillite, victime des « subprimes », ces crédits immobiliers toxiques titrisés et disséminés dans toute la finance mondiale. La panique est immédiate et planétaire : les banques ne se prêtent plus, les bourses s'effondrent, les États doivent injecter des centaines de milliards pour sauver le système, nationalisant au passage des banques entières. La récession qui suit est la pire depuis 1929 : millions de chômeurs, plans d'austérité, crise des dettes européennes dès 2010. La défiance née de cette crise, envers les banques et les élites, nourrit encore la politique d'aujourd'hui." }
    ],
    2009: [
      { t: "Naissance du Bitcoin",
        s: "Un mystérieux « Satoshi Nakamoto » lance le Bitcoin, première monnaie numérique sans banque ni État.",
        b: "Le 3 janvier 2009, un développeur anonyme se faisant appeler Satoshi Nakamoto crée le premier bloc de la blockchain Bitcoin, lançant la première monnaie entièrement numérique fonctionnant sans banque centrale ni État, en pleine défiance post-crise financière : le message caché dans ce bloc fondateur cite d'ailleurs un titre de journal sur le sauvetage des banques. D'abord curiosité de geeks, une pizza payée 10 000 bitcoins en 2010 est restée célèbre, le bitcoin voit sa valeur multipliée de façon vertigineuse, dépassant les 100 000 dollars l'unité, entre krachs spectaculaires et records. L'identité de Nakamoto, malgré les enquêtes, demeure l'un des grands mystères de notre époque." },
      { t: "Mort de Michael Jackson",
        s: "Le roi de la pop meurt brutalement à 50 ans, à quelques jours de son grand retour sur scène. Sidération mondiale.",
        b: "Le 25 juin 2009, Michael Jackson meurt à Los Angeles à 50 ans, d'une overdose de propofol, un puissant anesthésiant administré par son médecin personnel pour le faire dormir, à trois semaines d'une série de cinquante concerts événements à Londres censés marquer son grand retour. La nouvelle provoque une onde de choc planétaire, au point de faire vaciller Internet, Google croyant à une attaque. Sa mémoire est célébrée dans un hommage mondial retransmis en direct, tandis que son médecin sera condamné. Artiste le plus récompensé de l'histoire, auteur de l'album le plus vendu de tous les temps, « Thriller », Jackson laisse un héritage artistique immense et une part d'ombre toujours débattue." }
    ],
    2010: [
      { t: "Début du printemps arabe",
        s: "L'immolation d'un vendeur ambulant tunisien déclenche une vague révolutionnaire dans tout le monde arabe.",
        b: "Le 17 décembre 2010, à Sidi Bouzid, en Tunisie, un jeune vendeur ambulant, Mohamed Bouazizi, s'immole par le feu après la confiscation de sa marchandise et une humiliation de trop. Son geste embrase le pays : en quelques semaines, la contestation, organisée notamment via Facebook, chasse le président Ben Ali, au pouvoir depuis 23 ans. La vague gagne l'Égypte, où Moubarak tombe, la Libye, le Yémen, la Syrie... C'est le « printemps arabe », immense espoir démocratique aux lendemains contrastés : transition en Tunisie, chaos libyen, guerre atroce en Syrie. Une décennie plus tard, le bilan reste douloureux, mais l'onde de choc a durablement transformé la région." },
      { t: "Lancement d'Instagram",
        s: "Une petite application de photos aux filtres vintage voit le jour. Elle va transformer notre rapport à l'image... et à nous-mêmes.",
        b: "Le 6 octobre 2010, deux jeunes développeurs, Kevin Systrom et Mike Krieger, lancent Instagram, une application gratuite pour partager des photos carrées embellies par des filtres vintage. Le succès est fulgurant : 25 000 utilisateurs le premier jour, un million en trois mois, et un rachat par Facebook dès 2012 pour un milliard de dollars, alors que l'entreprise compte treize salariés. Devenu le royaume des influenceurs, des stories et des vies mises en scène, Instagram dépasse les deux milliards d'utilisateurs et transforme en profondeur la photographie, le marketing, le tourisme et l'estime de soi de toute une génération. Le premier cliché posté ? Un chien." }
    ],
    2011: [
      { t: "Catastrophe de Fukushima",
        s: "Un séisme puis un tsunami géant dévastent le Japon et provoquent l'accident nucléaire de Fukushima.",
        b: "Le 11 mars 2011, un séisme de magnitude 9, le plus puissant jamais mesuré au Japon, déclenche un tsunami dont les vagues dépassent par endroits 15 mètres. Le bilan est effroyable : environ 18 500 morts et disparus, des villes entières rayées de la carte. À la centrale de Fukushima Daiichi, les vagues noient les générateurs de secours : trois réacteurs entrent en fusion, provoquant le pire accident nucléaire depuis Tchernobyl et l'évacuation de plus de 150 000 personnes. Le choc pousse le Japon à arrêter durablement son parc nucléaire et l'Allemagne à programmer sa sortie de l'atome, relançant partout le débat sur cette énergie." },
      { t: "Mort d'Oussama ben Laden",
        s: "Un commando américain tue le chef d'Al-Qaïda au Pakistan, dix ans après le 11 septembre.",
        b: "Dans la nuit du 1er au 2 mai 2011, un commando de Navy SEALs américains héliporté investit une résidence fortifiée d'Abbottabad, au Pakistan, et tue Oussama ben Laden, le fondateur d'Al-Qaïda et commanditaire des attentats du 11 septembre 2001, traqué depuis près de dix ans. L'opération « Neptune's Lance », menée à l'insu du Pakistan et suivie en direct depuis la Maison-Blanche, photo devenue historique, est annoncée par Barack Obama dans une allocution solennelle ; des foules spontanées célèbrent la nouvelle à New York. Le corps est immergé en mer. La mort du terroriste le plus recherché du monde clôt symboliquement une décennie ouverte par le 11 septembre." }
    ],
    2012: [
      { t: "La « fin du monde » maya",
        s: "Le calendrier maya s'achève le 21 décembre 2012 : la planète s'amuse, et quelques-uns s'inquiètent vraiment. Rien ne se passe.",
        b: "Selon une interprétation fantaisiste du calendrier maya, dont un grand cycle s'achevait le 21 décembre 2012, le monde devait disparaître ce jour-là. La rumeur, amplifiée par Internet et par un film hollywoodien catastrophe, prend une ampleur planétaire : stages de survie, ruée sur le village « refuge » de Bugarach, dans l'Aude, envahi par les journalistes du monde entier, mises en garde de la NASA obligée de démentir sérieusement l'apocalypse. Les descendants des Mayas, eux, s'amusent : leur calendrier entamait simplement un nouveau cycle, comme le nôtre chaque 1er janvier. Le 22 décembre 2012 au matin, le monde était toujours là." },
      { t: "Barack Obama réélu",
        s: "Le premier président noir des États-Unis remporte un second mandat face à Mitt Romney.",
        b: "Le 6 novembre 2012, Barack Obama est réélu président des États-Unis face au républicain Mitt Romney. Quatre ans après son élection historique de 2008, portée par le slogan « Yes We Can » qui avait fait de lui le premier président noir du pays, il conserve la Maison-Blanche malgré un chômage élevé et une Amérique polarisée. Son bilan : le sauvetage de l'économie après la crise de 2008, la réforme de l'assurance santé « Obamacare », la fin de la guerre en Irak et l'élimination de Ben Laden. Son tweet de victoire, une photo enlaçant son épouse Michelle, devient alors le plus partagé de l'histoire." },
      { t: "Jeux olympiques de Londres",
        s: "Londres devient la première ville à organiser trois fois les JO, avec une cérémonie où la reine « saute en parachute » avec James Bond.",
        b: "À l'été 2012, Londres devient la première ville de l'histoire à accueillir trois fois les Jeux olympiques, après 1908 et 1948. La cérémonie d'ouverture, mise en scène par le cinéaste Danny Boyle, reste dans les annales, notamment pour son court-métrage où la reine Élisabeth II en personne donne la réplique à Daniel Craig en James Bond avant de « sauter en parachute » sur le stade. Côté sport, Usain Bolt réédite ses triplés de sprint, Michael Phelps devient l'athlète le plus médaillé de l'histoire olympique, et le Britannique Mo Farah fait vibrer son public. Des Jeux salués pour leur organisation et leur ambiance." }
    ],
    2013: [
      { t: "Le mariage pour tous",
        s: "La France devient le 14e pays à ouvrir le mariage aux couples de même sexe, après des mois de débats passionnés.",
        b: "Le 17 mai 2013, la loi ouvrant le mariage et l'adoption aux couples de même sexe est promulguée : la France devient le quatorzième pays au monde à instaurer le « mariage pour tous ». Promesse de campagne de François Hollande, portée par la ministre Christiane Taubira dont les discours à l'Assemblée sont restés célèbres, la loi a été adoptée au terme de mois d'un débat d'une intensité rare : manifestations géantes de la « Manif pour tous » comme de ses partisans, 136 heures de débats parlementaires, près de 5 000 amendements. Le premier mariage est célébré à Montpellier le 29 mai. Dix ans plus tard, la réforme est très largement acceptée." },
      { t: "Mort de Nelson Mandela",
        s: "Madiba s'éteint à 95 ans. Le monde entier salue le père de la nation sud-africaine et l'icône de la réconciliation.",
        b: "Le 5 décembre 2013, Nelson Mandela meurt à Johannesburg à 95 ans. L'Afrique du Sud pleure « Madiba », le père de la nation : 27 ans de prison sous l'apartheid, une sortie sans haine, un prix Nobel de la paix partagé avec de Klerk, et une présidence, de 1994 à 1999, consacrée à la réconciliation d'un pays qui semblait promis à la guerre civile, jusqu'à endosser le maillot des Springboks lors de la Coupe du monde de rugby 1995. Son hommage réunit une centaine de chefs d'État, images inédites, dont une poignée de main entre Obama et Raúl Castro. Mandela reste l'une des figures morales les plus universellement admirées du 20e siècle." }
    ],
    2014: [
      { t: "La Russie annexe la Crimée",
        s: "Après une opération éclair, la Russie annexe la péninsule ukrainienne de Crimée. L'Occident sanctionne, la suite est connue.",
        b: "En février 2014, après la révolution de Maïdan qui chasse le président ukrainien prorusse Ianoukovitch, des soldats sans insignes, les « petits hommes verts » que Moscou reconnaîtra plus tard comme les siens, prennent le contrôle de la Crimée, péninsule ukrainienne au statut stratégique, abritant la flotte russe de la mer Noire. Un référendum éclair, non reconnu par la communauté internationale, entérine l'annexion par la Russie en mars. C'est la première annexion de territoire en Europe depuis 1945 : sanctions occidentales, exclusion de la Russie du G8, et début d'une guerre dans l'est de l'Ukraine qui débouchera sur l'invasion générale de 2022." },
      { t: "Philae se pose sur une comète",
        s: "Après dix ans de voyage, la sonde européenne Rosetta largue Philae, premier engin à se poser sur une comète. Cocorico spatial.",
        b: "Le 12 novembre 2014, après dix ans de voyage et plus de six milliards de kilomètres, la mission européenne Rosetta réussit un exploit inédit : son petit atterrisseur Philae, une centaine de kilos, se pose sur le noyau de la comète Tchourioumov-Guérassimenko, dite « Tchouri », un caillou glacé de quatre kilomètres filant à 60 000 km/h. L'atterrissage est rocambolesque, Philae rebondit deux fois et finit coincé à l'ombre d'une falaise, mais il transmet des données scientifiques précieuses sur ces vestiges de la formation du système solaire, possibles livreurs d'eau et de molécules de la vie sur Terre. Une immense fierté pour l'Europe spatiale, très suivie en France." }
    ],
    2015: [
      { t: "Attentat contre Charlie Hebdo",
        s: "Des terroristes déciment la rédaction de Charlie Hebdo. Des millions de personnes défilent aux cris de « Je suis Charlie ».",
        b: "Le 7 janvier 2015, deux terroristes djihadistes pénètrent dans les locaux de Charlie Hebdo, à Paris, et assassinent douze personnes, dont les dessinateurs Cabu, Charb, Wolinski, Tignous et Honoré, pour venger les caricatures de Mahomet publiées par le journal. Les jours suivants, une policière est tuée, puis quatre clients juifs de l'Hyper Cacher. Le slogan « Je suis Charlie » fait le tour du monde, et le 11 janvier, environ quatre millions de personnes défilent en France, avec une cinquantaine de chefs d'État à Paris, la plus grande manifestation de l'histoire du pays. L'année s'assombrira encore avec les attentats du 13 novembre à Paris et Saint-Denis." },
      { t: "L'accord de Paris sur le climat",
        s: "À la COP21, 195 pays s'accordent pour limiter le réchauffement climatique « nettement en dessous de 2 degrés ».",
        b: "Le 12 décembre 2015, au Bourget, près de Paris, la COP21 s'achève sur un moment d'histoire : 195 pays adoptent l'accord de Paris, premier accord universel sur le climat. Objectif : contenir le réchauffement « nettement en dessous de 2 degrés » par rapport à l'ère préindustrielle, en visant 1,5 degré, chaque pays s'engageant sur ses propres contributions, revues à la hausse régulièrement. Le coup de marteau du ministre Laurent Fabius, ému aux larmes, scelle des années de négociations. L'accord survivra au retrait temporaire des États-Unis de Trump, mais sa mise en œuvre reste le grand défi : les records de chaleur continuent de tomber." }
    ],
    2016: [
      { t: "Le Royaume-Uni vote le Brexit",
        s: "À la surprise générale, 52 % des Britanniques votent pour quitter l'Union européenne.",
        b: "Le 23 juin 2016, les Britanniques votent par référendum à 51,9 % pour quitter l'Union européenne. Le « Brexit », que peu d'observateurs et de sondeurs avaient vu venir, provoque un séisme : démission du Premier ministre David Cameron, qui avait convoqué le vote en pensant le gagner, chute de la livre, et stupeur à Bruxelles, aucun pays n'ayant jamais quitté l'Union. Suivront quatre années de négociations chaotiques, trois Premiers ministres et des débats sans fin sur la frontière irlandaise, avant la sortie effective le 31 janvier 2020. Le Brexit reste l'un des symboles de la vague populiste qui secoue alors les démocraties occidentales." },
      { t: "Donald Trump élu président",
        s: "Le milliardaire de la téléréalité bat Hillary Clinton et entre à la Maison-Blanche, contre tous les pronostics.",
        b: "Le 8 novembre 2016, Donald Trump, magnat de l'immobilier et star de téléréalité sans aucune expérience politique, est élu 45e président des États-Unis face à Hillary Clinton, pourtant donnée largement gagnante par les sondages ; elle obtient d'ailleurs près de trois millions de voix de plus, mais perd au système des grands électeurs. Sa campagne au slogan « Make America Great Again », rythmée par les tweets, les meetings hors normes et les polémiques, révèle une Amérique fracturée. Son mandat le sera tout autant, jusqu'à l'assaut du Capitole par ses partisans en janvier 2021. Battu par Joe Biden en 2020, il reviendra à la Maison-Blanche en 2025." },
      { t: "La folie Pokémon Go",
        s: "Le jeu en réalité augmentée jette des millions de chasseurs de Pokémon dans les rues du monde entier.",
        b: "En juillet 2016, l'application Pokémon Go déferle sur la planète : grâce à la réalité augmentée et au GPS, on chasse Pikachu et ses congénères dans les vraies rues, les parcs et les monuments. Le phénomène est instantané et surréaliste : des foules de dresseurs smartphone en main envahissent les trottoirs, des attroupements se forment à minuit pour un Pokémon rare, des lieux improbables deviennent des « arènes », et les médecins saluent même ce jeu qui fait marcher. Records de téléchargements pulvérisés, serveurs à genoux, quelques accidents aussi. Vingt ans après les premières cartouches Game Boy, Pokémon prouve qu'il reste la licence la plus puissante du divertissement mondial." }
    ],
    2017: [
      { t: "Emmanuel Macron élu président",
        s: "À 39 ans, Emmanuel Macron devient le plus jeune président de l'histoire de France, sans parti traditionnel derrière lui.",
        b: "Le 7 mai 2017, Emmanuel Macron est élu président de la République avec 66 % des voix face à Marine Le Pen, au terme d'une campagne hors norme : jamais élu auparavant, l'ancien ministre de l'Économie de 39 ans a fondé son mouvement « En Marche » un an plus tôt et pulvérisé les partis traditionnels, PS et Les Républicains éliminés dès le premier tour, une première. Plus jeune président de l'histoire de France, plus jeune dirigeant du pays depuis Napoléon, il incarne le « dégagisme » et le « en même temps ». Son premier quinquennat sera traversé par les Gilets jaunes, le Covid et la guerre en Ukraine ; il sera réélu en 2022." },
      { t: "L'onde de choc #MeToo",
        s: "L'affaire Weinstein libère la parole des femmes dans le monde entier. Le hashtag #MeToo devient un mouvement historique.",
        b: "En octobre 2017, le New York Times puis le New Yorker révèlent des décennies d'agressions sexuelles et de viols imputés au tout-puissant producteur hollywoodien Harvey Weinstein. L'actrice Alyssa Milano invite alors les femmes victimes de violences sexuelles à répondre « moi aussi » : le hashtag #MeToo, créé dix ans plus tôt par la militante Tarana Burke, explose, des millions de témoignages déferlent dans le monde entier, en France sous le mot-clé #BalanceTonPorc. Carrières brisées, procès, Weinstein condamné à de lourdes peines : c'est un basculement historique dans la prise en compte des violences sexuelles, dont l'onde de choc traverse encore le cinéma, la politique, le sport et les médias." }
    ],
    2018: [
      { t: "Le mouvement des Gilets jaunes",
        s: "Parti d'une taxe sur les carburants, un mouvement inédit occupe les ronds-points et défile chaque samedi.",
        b: "Le 17 novembre 2018, près de 300 000 personnes en gilet fluorescent bloquent routes et ronds-points contre la hausse des taxes sur les carburants. Né sur Facebook, sans parti ni syndicat, le mouvement des Gilets jaunes exprime vite un ras-le-bol plus large des « invisibles » de la France périphérique : fins de mois difficiles, sentiment d'abandon. Les « actes » du samedi se succèdent, émaillés de violences spectaculaires, Champs-Élysées saccagés, Arc de Triomphe tagué, et de blessés graves. Le gouvernement lâche des milliards, annule la taxe et lance le Grand Débat national. Inédit par sa forme, sa durée et sa radicalité, le mouvement marque durablement la vie politique française." },
      { t: "Les Bleus champions du monde en Russie",
        s: "Vingt ans après 1998, la France de Mbappé et Deschamps décroche sa deuxième étoile en battant la Croatie 4 à 2.",
        b: "Le 15 juillet 2018, à Moscou, l'équipe de France remporte sa deuxième Coupe du monde en battant la Croatie 4 à 2, vingt ans après le sacre de 1998. Portée par un Kylian Mbappé de 19 ans, élu meilleur jeune du tournoi et comparé à Pelé, par Griezmann, Pogba et Kanté, la bande à Didier Deschamps, devenu l'un des rares hommes champions du monde comme joueur puis comme sélectionneur, fait chavirer le pays : Champs-Élysées noirs de monde, scènes de liesse dans toutes les villes sous un ciel d'été orageux. La demi-finale contre la Belgique et le huitième d'anthologie face à l'Argentine, 4 à 3, restent dans les mémoires." }
    ],
    2019: [
      { t: "Incendie de Notre-Dame de Paris",
        s: "La cathédrale brûle en direct sous les yeux du monde entier. Sa flèche s'effondre, mais les tours sont sauvées.",
        b: "Le 15 avril 2019 en fin d'après-midi, un incendie se déclare dans les combles de Notre-Dame de Paris. Pendant des heures, le monde entier, sidéré, regarde en direct brûler la « forêt » de chênes du 13e siècle ; à 19h50, la flèche de Viollet-le-Duc s'effondre dans les flammes. Des centaines de pompiers, dont certains à l'intérieur au péril de leur vie, sauvent les deux tours, la structure et les rosaces ; les reliques et de nombreuses œuvres sont évacuées à la chaîne. En quelques jours, les dons affluent du monde entier : près de 850 millions d'euros. Après un chantier hors norme, la cathédrale rouvrira en décembre 2024, cinq ans et demi plus tard." },
      { t: "Apparition du Covid-19",
        s: "En décembre, une mystérieuse pneumonie apparaît à Wuhan, en Chine. Personne n'imagine encore la suite.",
        b: "En décembre 2019, les autorités sanitaires de Wuhan, métropole chinoise de onze millions d'habitants, signalent des cas groupés d'une pneumonie inconnue, d'abord reliés à un marché d'animaux vivants. Le 31 décembre, la Chine alerte l'Organisation mondiale de la santé ; début janvier, un nouveau coronavirus est identifié et son génome publié. Personne ne mesure encore que ce virus, bientôt nommé SARS-CoV-2, responsable de la maladie Covid-19, va se répandre sur toute la planète en quelques semaines, provoquer la pire pandémie depuis un siècle, des millions de morts, et mettre à l'arrêt l'économie mondiale. La question de son origine exacte, marché ou laboratoire, fait toujours débat." }
    ],
    2020: [
      { t: "Le monde confiné",
        s: "Face au Covid-19, plus de la moitié de l'humanité est confinée. En France : attestations, applaudissements de 20 heures et pain maison.",
        b: "Au printemps 2020, face à la pandémie de Covid-19, l'impensable se produit : plus de la moitié de l'humanité est confinée chez elle. En France, du 17 mars au 11 mai, la vie s'arrête : écoles et commerces fermés, attestations de sortie limitées à une heure et un kilomètre, rues désertes, hôpitaux submergés et soignants applaudis chaque soir à 20 heures aux fenêtres. Le télétravail, les apéros en visio, la pénurie de farine et de papier toilette et l'école à la maison entrent dans le quotidien. Deux autres confinements suivront. Cette parenthèse planétaire, inédite dans l'histoire moderne, laissera des traces économiques, sociales et psychologiques durables." },
      { t: "Le Brexit devient réalité",
        s: "Le 31 janvier, le Royaume-Uni quitte officiellement l'Union européenne, après 47 ans de vie commune.",
        b: "Le 31 janvier 2020 à minuit, heure de Bruxelles, le Royaume-Uni quitte officiellement l'Union européenne, trois ans et demi après le référendum de 2016 et 47 ans après son adhésion. À Londres, les partisans de Boris Johnson fêtent « l'indépendance » devant Westminster, tandis qu'à Bruxelles le drapeau britannique est retiré des institutions. Une période de transition maintient les règles communes jusqu'à la fin de l'année, le temps de négocier dans la douleur un accord commercial conclu la veille de Noël. Aucun pays n'avait jamais quitté l'Union. Douanes, files de camions à Douvres, fin d'Erasmus pour les Britanniques : les effets concrets se font vite sentir." }
    ],
    2021: [
      { t: "La vaccination contre le Covid",
        s: "Des vaccins développés en un temps record sont injectés à des milliards d'humains. Une prouesse scientifique historique.",
        b: "En 2021, la plus grande campagne de vaccination de l'histoire se déploie : moins d'un an après l'identification du virus, un délai record absolu, quand un vaccin demandait auparavant dix ans, des milliards de doses sont administrées dans le monde. Les vaccins à ARN messager de Pfizer-BioNTech et Moderna, technologie longtemps jugée futuriste et fruit de décennies de recherche, notamment celle de Katalin Karikó, future prix Nobel, démontrent une efficacité spectaculaire contre les formes graves. En France, la campagne débute fin décembre 2020 avec Mauricette, 78 ans. L'inégale répartition des doses entre pays riches et pauvres, elle, rappelle les limites de la solidarité mondiale." },
      { t: "Le pass sanitaire s'impose en France",
        s: "Restaurant, cinéma, train : il faut désormais montrer un QR code. Le pass sanitaire divise le pays.",
        b: "À l'été 2021, la France instaure le pass sanitaire : pour entrer au restaurant, au cinéma, à l'hôpital ou monter dans un train longue distance, il faut présenter un QR code attestant d'une vaccination complète, d'un test négatif ou d'un rétablissement récent. Annoncée par Emmanuel Macron le 12 juillet, la mesure provoque un boom immédiat des prises de rendez-vous vaccinaux, des records mondiaux, mais aussi un mouvement de protestation qui défile tous les samedis de l'été. Transformé début 2022 en pass vaccinal, le dispositif sera suspendu au printemps. Le QR code dégainé à l'entrée des cafés restera l'un des symboles de cette période." }
    ],
    2022: [
      { t: "La Russie envahit l'Ukraine",
        s: "Le 24 février, la Russie lance une invasion générale de l'Ukraine. La guerre revient en Europe.",
        b: "Le 24 février 2022 à l'aube, Vladimir Poutine lance ce qu'il appelle une « opération militaire spéciale » : l'invasion générale de l'Ukraine, la plus grande offensive militaire en Europe depuis 1945. Kiev, que Moscou pensait prendre en quelques jours, résiste, incarnée par son président Volodymyr Zelensky, resté sur place : « J'ai besoin de munitions, pas d'un taxi. » Des millions d'Ukrainiens fuient, l'Europe accueille les réfugiés, sanctionne massivement la Russie et découvre sa dépendance au gaz russe ; les noms de Boutcha ou Marioupol s'inscrivent dans la mémoire des atrocités. Le conflit, toujours en cours, a fait basculer le monde dans une nouvelle ère géopolitique." },
      { t: "Mort de la reine Élisabeth II",
        s: "Après 70 ans de règne, un record, Élisabeth II s'éteint à 96 ans. Le monde entier suit ses funérailles.",
        b: "Le 8 septembre 2022, Élisabeth II meurt paisiblement dans son château écossais de Balmoral, à 96 ans, quelques mois après avoir célébré son jubilé de platine : 70 ans de règne, un record dans l'histoire britannique. Montée sur le trône en 1952, elle aura traversé quinze Premiers ministres, de Churchill à Liz Truss reçue deux jours avant sa mort, et incarné la stabilité d'un monde en bouleversement permanent. Le Royaume-Uni vit dix jours de deuil minutieusement réglés, des kilomètres de file d'attente pour se recueillir devant son cercueil, et des funérailles suivies par des milliards de téléspectateurs. Son fils devient le roi Charles III." }
    ],
    2023: [
      { t: "L'IA générative conquiert le grand public",
        s: "ChatGPT et les générateurs d'images explosent : des centaines de millions de personnes dialoguent avec une intelligence artificielle.",
        b: "En 2023, l'intelligence artificielle sort des laboratoires pour entrer dans toutes les conversations. ChatGPT, lancé fin novembre 2022, atteint cent millions d'utilisateurs en deux mois, le service grand public à la croissance la plus rapide de l'histoire à ce moment-là : chacun peut désormais dialoguer avec une machine qui rédige, résume, traduit ou code. Les générateurs d'images comme Midjourney sèment le trouble, un faux pape en doudoune blanche piège la planète entière. Écoles, entreprises et gouvernements s'interrogent, des milliers d'experts réclament une pause, l'Europe légifère. L'année 2023 restera comme celle où l'humanité a commencé à cohabiter avec l'IA." }
    ],
    2024: [
      { t: "Jeux olympiques de Paris",
        s: "Paris accueille des Jeux grandioses, ouverts par une cérémonie sur la Seine. La France vit un été en or.",
        b: "À l'été 2024, cent ans après 1924, Paris accueille les Jeux olympiques et signe un succès qui surprend le pays lui-même. La cérémonie d'ouverture, une première hors d'un stade, transforme la Seine en scène géante sous la pluie, avec une vasque-ballon s'élevant chaque soir au-dessus des Tuileries et Céline Dion chantant depuis la tour Eiffel. Épreuves au pied des monuments, Léon Marchand quadruple champion olympique dans un bassin en fusion, Teddy Riner en porte-drapeau du dernier sacre : la France, d'humeur morose, se découvre en liesse pendant quinze jours. Les Jeux paralympiques prolongent la fête. « Paris 2024 » entre immédiatement dans les grands souvenirs collectifs." },
      { t: "Notre-Dame de Paris rouvre ses portes",
        s: "Cinq ans après l'incendie, la cathédrale restaurée rouvre, plus lumineuse que jamais. Le chantier « impossible » a été tenu.",
        b: "Les 7 et 8 décembre 2024, Notre-Dame de Paris rouvre officiellement ses portes, cinq ans et demi après l'incendie qui avait failli l'emporter. Le pari, jugé fou, d'Emmanuel Macron de la rebâtir en cinq ans a été tenu par un chantier hors norme : environ 2 000 compagnons, charpentiers, tailleurs de pierre, restaurateurs, une flèche reconstruite à l'identique et une « forêt » de chênes taillée comme au Moyen Âge, le tout financé par 846 millions d'euros de dons venus du monde entier. Le monde redécouvre une cathédrale à la pierre blonde, d'une luminosité oubliée depuis des siècles. Des dizaines de chefs d'État assistent à la réouverture, orgue et cloches enfin réveillés." }
    ],
    2025: [
      { t: "L'IA s'installe dans le quotidien",
        s: "Assistants intégrés partout, au travail, à l'école, dans la poche : l'intelligence artificielle devient un réflexe quotidien.",
        b: "En 2025, l'intelligence artificielle cesse d'être une curiosité pour devenir un outil du quotidien : intégrée aux téléphones, aux moteurs de recherche, aux logiciels de bureau et aux applications scolaires, elle rédige des courriers, prépare des réunions, aide aux devoirs et répond à la moindre question. Les entreprises réorganisent des métiers entiers autour de ces assistants, pendant que se multiplient les débats sur l'emploi, les droits d'auteur, la fiabilité des réponses et la consommation d'énergie des centres de données. L'Union européenne commence à appliquer son AI Act, première grande loi au monde encadrant ces systèmes. Une révolution d'usage comparable à l'arrivée d'Internet, en beaucoup plus rapide." },
      { t: "Le climat bat de nouveaux records",
        s: "Températures des océans, recul des glaciers, canicules : les records climatiques continuent de tomber année après année.",
        b: "L'année 2025 confirme l'emballement du thermomètre mondial : après 2024, année la plus chaude jamais mesurée et première à dépasser en moyenne le seuil de 1,5 degré de réchauffement, les records continuent de tomber, températures des océans, recul des glaciers, canicules précoces et incendies géants. Les scientifiques rappellent que chaque dixième de degré compte et que les engagements de l'accord de Paris, dix ans après sa signature, restent très insuffisants. Dans le quotidien des Français, cela se traduit par des étés de plus en plus éprouvants, des restrictions d'eau récurrentes et l'adaptation qui s'impose partout : villes végétalisées, bâtiments repensés, agriculture bousculée." }
    ],
  };

  // ─────────────────────────────────────────────────────────────
  // VOUS ÊTES NÉ COMME : CÉLÉBRITÉS NÉES LE MÊME JOUR (base + ajouts back-office)
  // Clé : "MM-DD"  ·  Format : [ { name, blurb }, … ]
  // ─────────────────────────────────────────────────────────────
                              const birthdays = {
    "01-01": [
      { name: "Lilian Thuram", blurb: "footballeur (1972)" },
      { name: "Olivia Ruiz", blurb: "chanteuse (1980)" }
    ],
    "01-02": [
      { name: "Nozman", blurb: "vidéaste de vulgarisation scientifique (1990)" },
      { name: "Christophe Beaugrand", blurb: "animateur de télévision (1977)" }
    ],
    "01-03": [
      { name: "Mel Gibson", blurb: "acteur et réalisateur (1956)" },
      { name: "Greta Thunberg", blurb: "militante écologiste (2003)" }
    ],
    "01-04": [
      { name: "Louis Braille", blurb: "inventeur de l'alphabet pour aveugles (1809)" },
      { name: "Isaac Newton", blurb: "physicien et mathématicien (1643)" }
    ],
    "01-05": [
      { name: "Bradley Cooper", blurb: "acteur (1975)" },
      { name: "Marilyn Manson", blurb: "chanteur de rock (1969)" }
    ],
    "01-06": [
      { name: "Thierry Ardisson", blurb: "animateur de télévision (1949)" },
      { name: "Mister Bean", blurb: "personnage de comédie" }
    ],
    "01-07": [
      { name: "Nicolas Cage", blurb: "acteur (1964)" }
    ],
    "01-08": [
      { name: "Kim Jong-Un", blurb: "dirigeant nord-coréen (1984)" },
      { name: "Pascal Obispo", blurb: "chanteur (1965)" },
      { name: "Elvis Presley", blurb: "chanteur, roi du rock (1935)" },
      { name: "Stephen Hawking", blurb: "physicien (1942)" }
    ],
    "01-09": [
      { name: "Lara Fabian", blurb: "chanteuse (1970)" },
      { name: "Richard Nixon", blurb: "président des États-Unis (1913)" }
    ],
    "01-10": [
      { name: "Claudio Capéo", blurb: "chanteur (1985)" },
      { name: "Evelyne Thomas", blurb: "animatrice de télévision (1964)" }
    ],
    "01-11": [
      { name: "Albert Dupontel", blurb: "acteur et réalisateur (1964)" },
      { name: "Jérôme Kerviel", blurb: "ancien trader (1977)" }
    ],
    "01-12": [
      { name: "Jeff Bezos", blurb: "fondateur d'Amazon (1964)" },
      { name: "Philippe Peythieu", blurb: "comédien de doublage (voix d'Homer Simpson) (1950)" }
    ],
    "01-13": [
      { name: "Orlando Bloom", blurb: "acteur (1977)" },
      { name: "Cabu", blurb: "dessinateur de presse (1938)" }
    ],
    "01-14": [
      { name: "Jul", blurb: "rappeur (1990)" },
      { name: "Soprano", blurb: "rappeur (1979)" }
    ],
    "01-15": [
      { name: "Martin Luther King", blurb: "pasteur et militant des droits civiques (1929)" },
      { name: "Molière", blurb: "dramaturge (1622)" }
    ],
    "01-16": [
      { name: "Richard Bohringer", blurb: "acteur (1942)" },
      { name: "Kate Moss", blurb: "mannequin (1974)" }
    ],
    "01-17": [
      { name: "Jim Carrey", blurb: "acteur (1962)" },
      { name: "Jamy Gourmaud", blurb: "animateur de vulgarisation scientifique (1964)" },
      { name: "Al Capone", blurb: "gangster (1899)" }
    ],
    "01-18": [
      { name: "Valérie Damidot", blurb: "animatrice de télévision (1965)" },
      { name: "Hardy", blurb: "acteur comique, du duo Laurel et Hardy (1892)" }
    ],
    "01-19": [
      { name: "Tibo Inshape", blurb: "vidéaste de fitness (1992)" },
      { name: "James Watt", blurb: "ingénieur (machine à vapeur) (1736)" }
    ],
    "01-20": [
      { name: "Omar Sy", blurb: "acteur (1978)" },
      { name: "Buzz Aldrin", blurb: "astronaute (2e homme sur la Lune) (1930)" }
    ],
    "01-21": [
      { name: "Marina Foïs", blurb: "actrice (1970)" },
      { name: "Christian Dior", blurb: "couturier (1905)" }
    ],
    "01-22": [
      { name: "Bigflo", blurb: "rappeur (1993)" },
      { name: "Isabelle Nanty", blurb: "actrice (1962)" }
    ],
    "01-23": [
      { name: "Christophe Dechavanne", blurb: "animateur de télévision (1958)" },
      { name: "Didier Bourdon", blurb: "acteur et humoriste (1959)" }
    ],
    "01-24": [
      { name: "Raymond Domenech", blurb: "ancien sélectionneur de football (1952)" },
      { name: "Daniel Auteuil", blurb: "acteur (1950)" }
    ],
    "01-25": [
      { name: "Clara Morgane", blurb: "animatrice et chanteuse (1981)" },
      { name: "Volodomyr Zelensky", blurb: "président de l'Ukraine (1978)" }
    ],
    "01-26": [
      { name: "Jean-Paul Rouve", blurb: "acteur (1967)" },
      { name: "Michel Sardou", blurb: "chanteur (1947)" },
      { name: "Bernard Tapie", blurb: "homme d'affaires (1943)" }
    ],
    "01-27": [
      { name: "Squeezie", blurb: "vidéaste (1996)" },
      { name: "Mozart", blurb: "compositeur (1756)" }
    ],
    "01-28": [
      { name: "Nicolas Sarkozy", blurb: "ancien président de la République (1955)" },
      { name: "Alfred Grévin", blurb: "caricaturiste et fondateur du musée Grévin (1827)" }
    ],
    "01-29": [
      { name: "François Civil", blurb: "acteur (1990)" },
      { name: "Tom Selleck", blurb: "acteur (1945)" }
    ],
    "01-30": [
      { name: "Kaaris", blurb: "rappeur (1980)" },
      { name: "Phil Collins", blurb: "musicien (1951)" }
    ],
    "01-31": [
      { name: "Franz Schubert", blurb: "compositeur (1797)" },
      { name: "Keen'V", blurb: "chanteur (1983)" }
    ],
    "02-01": [
      { name: "Claude François", blurb: "chanteur (1939)" },
      { name: "Stéphanie de Monaco", blurb: "princesse de Monaco (1965)" }
    ],
    "02-02": [
      { name: "Vincent Dedienne", blurb: "humoriste et comédien (1987)" },
      { name: "Valéry Giscard d'Estaing", blurb: "ancien président de la République (1926)" }
    ],
    "02-03": [
      { name: "Simone Weil", blurb: "philosophe (1909)" },
      { name: "Gérémy Crédeville", blurb: "humoriste (1987)" }
    ],
    "02-04": [
      { name: "Juju Fitcats", blurb: "vidéaste de fitness (1995)" },
      { name: "William Leymergie", blurb: "animateur de télévision (1947)" }
    ],
    "02-05": [
      { name: "Nabilla", blurb: "personnalité de télé-réalité (1992)" },
      { name: "Cristiano Ronaldo", blurb: "footballeur (1985)" }
    ],
    "02-06": [
      { name: "Bob Marley", blurb: "chanteur de reggae (1945)" },
      { name: "Jacques Villeret", blurb: "acteur (1951)" }
    ],
    "02-07": [
      { name: "Rémi Gaillard", blurb: "vidéaste et humoriste (1975)" },
      { name: "Julien Courbet", blurb: "animateur de télévision et de radio (1965)" },
      { name: "Jain", blurb: "chanteuse (1992)" }
    ],
    "02-08": [
      { name: "Philippe Caverivière", blurb: "humoriste (1971)" },
      { name: "Jules Verne", blurb: "écrivain (1828)" },
      { name: "Daft Punk", blurb: "duo de musique électronique" }
    ],
    "02-09": [
      { name: "Kool Shen", blurb: "rappeur (1966)" },
      { name: "Gérard Lenorman", blurb: "chanteur (1945)" }
    ],
    "02-10": [
      { name: "Natasha St-Pier", blurb: "chanteuse (1981)" }
    ],
    "02-11": [
      { name: "Jennifer Aniston", blurb: "actrice (1969)" },
      { name: "Jacques Pradel", blurb: "animateur de télévision et de radio (1947)" },
      { name: "Thomas Edison", blurb: "inventeur (1847)" }
    ],
    "02-12": [
      { name: "Abraham Lincoln", blurb: "président des États-Unis (1809)" },
      { name: "Charles Darwin", blurb: "naturaliste (1809)" }
    ],
    "02-13": [
      { name: "Vianney", blurb: "chanteur (1991)" },
      { name: "Robbie Williams", blurb: "chanteur (1974)" }
    ],
    "02-14": [
      { name: "Simon Pegg", blurb: "acteur et scénariste (1970)" },
      { name: "Raphaëlle Ricci", blurb: "animatrice de télévision (1967)" }
    ],
    "02-15": [
      { name: "Louis XV", blurb: "roi de France (1710)" },
      { name: "Galilée", blurb: "astronome et physicien (1564)" }
    ],
    "02-16": [
      { name: "Kim Jong-il", blurb: "dirigeant nord-coréen (1941)" },
      { name: "John McEnroe", blurb: "joueur de tennis (1959)" }
    ],
    "02-17": [
      { name: "Michael Jordan", blurb: "basketteur (1963)" },
      { name: "David Douillet", blurb: "judoka (1969)" }
    ],
    "02-18": [
      { name: "John Travolta", blurb: "acteur (1954)" },
      { name: "Hans Asperger", blurb: "pédiatre (1906)" },
      { name: "Marianne James", blurb: "chanteuse et animatrice (1962)" }
    ],
    "02-19": [
      { name: "Nicolas Copernic", blurb: "astronome (1473)" },
      { name: "Steevy Boulay", blurb: "animateur et chroniqueur (1980)" },
      { name: "Navo", blurb: "vidéaste et humoriste (1983)" }
    ],
    "02-20": [
      { name: "Kurt Cobain", blurb: "chanteur (Nirvana) (1967)" },
      { name: "Carlos", blurb: "chanteur (1943)" }
    ],
    "02-21": [
      { name: "Jeanne Calment", blurb: "doyenne de l'humanité (1875)" },
      { name: "Nina Simone", blurb: "chanteuse et pianiste (1933)" }
    ],
    "02-22": [
      { name: "Jules Renard", blurb: "écrivain (1864)" },
      { name: "Arthur Schopenhauer", blurb: "philosophe (1788)" }
    ],
    "02-23": [
      { name: "Louis Bertignac", blurb: "guitariste et chanteur (1954)" }
    ],
    "02-24": [
      { name: "Steve Jobs", blurb: "cofondateur d'Apple (1955)" },
      { name: "Laurent Ruquier", blurb: "animateur de télévision et de radio (1963)" }
    ],
    "02-25": [
      { name: "Régis Laspalès", blurb: "humoriste et comédien (1957)" },
      { name: "Sidonie Bonnec", blurb: "animatrice de télévision et de radio (1977)" }
    ],
    "02-26": [
      { name: "Victor Hugo", blurb: "écrivain (1802)" },
      { name: "Hélène Ségara", blurb: "chanteuse (1971)" },
      { name: "Buffalo Bill", blurb: "figure du Far West (1846)" },
      { name: "Levi Strauss", blurb: "industriel (inventeur du jean) (1829)" }
    ],
    "02-27": [
      { name: "Thomas Pesquet", blurb: "astronaute (1978)" },
      { name: "Derren Brown", blurb: "mentaliste (1971)" }
    ],
    "02-28": [
      { name: "Marcel Pagnol", blurb: "écrivain et cinéaste (1895)" },
      { name: "Jeanne Mas", blurb: "chanteuse (1958)" }
    ],
    "02-29": [
      { name: "Gérard Darmon", blurb: "acteur (1948)" },
      { name: "Sugar Sammy", blurb: "humoriste (1976)" }
    ],
    "03-01": [
      { name: "Frédéric Chopin", blurb: "compositeur et pianiste (1810)" },
      { name: "Justin Bieber", blurb: "chanteur (1994)" }
    ],
    "03-02": [
      { name: "Chris Martin", blurb: "chanteur (Coldplay) (1977)" },
      { name: "Daphné Bürki", blurb: "animatrice de télévision (1980)" }
    ],
    "03-03": [
      { name: "Fauve Hautot", blurb: "danseuse et chorégraphe (1986)" },
      { name: "Stéphane De Groodt", blurb: "acteur et humoriste (1966)" }
    ],
    "03-04": [
      { name: "François Fillon", blurb: "ancien Premier ministre (1954)" },
      { name: "Vivaldi", blurb: "compositeur (1678)" },
      { name: "Amixem", blurb: "vidéaste (1991)" }
    ],
    "03-05": [
      { name: "MC Solaar", blurb: "rappeur (1969)" },
      { name: "Bernard Arnault", blurb: "homme d'affaires (1949)" }
    ],
    "03-06": [
      { name: "Michel-Ange", blurb: "peintre et sculpteur (1475)" },
      { name: "Jean-Luc Lemoine", blurb: "humoriste et animateur (1970)" }
    ],
    "03-07": [
      { name: "Bryan Cranston", blurb: "acteur (1956)" },
      { name: "Maurice Ravel", blurb: "compositeur (1875)" }
    ],
    "03-08": [
      { name: "Journée de la femme", blurb: "journée internationale des droits des femmes" },
      { name: "Agathe Lecaron", blurb: "animatrice de télévision (1974)" },
      { name: "Sandrine Rousseau", blurb: "femme politique (1972)" }
    ],
    "03-09": [
      { name: "Valérie Lemercier", blurb: "actrice et réalisatrice (1964)" },
      { name: "Pierre-Emmanuel Barré", blurb: "humoriste (1984)" }
    ],
    "03-10": [
      { name: "Arthur", blurb: "animateur de télévision (1966)" },
      { name: "Chuck Norris", blurb: "acteur (1940)" },
      { name: "Oussama Ben Laden", blurb: "fondateur d'Al-Qaïda (1957)" }
    ],
    "03-11": [
      { name: "Arnaud Tsamère", blurb: "humoriste (1975)" },
      { name: "Éric Naulleau", blurb: "chroniqueur et essayiste (1961)" }
    ],
    "03-12": [
      { name: "Stromae", blurb: "chanteur (1985)" },
      { name: "Nelson Monfort", blurb: "journaliste sportif (1954)" }
    ],
    "03-13": [
      { name: "Pierre Niney", blurb: "acteur (1989)" },
      { name: "Didier Raoult", blurb: "microbiologiste (1952)" },
      { name: "Jean-Yves Lafesse", blurb: "humoriste (1957)" }
    ],
    "03-14": [
      { name: "Albert Einstein", blurb: "physicien (1879)" },
      { name: "Albert de Monaco", blurb: "prince de Monaco (1958)" },
      { name: "Nicolas Anelka", blurb: "footballeur (1979)" }
    ],
    "03-15": [
      { name: "Cyril Féraud", blurb: "animateur de télévision (1985)" },
      { name: "Eva Longoria", blurb: "actrice (1975)" }
    ],
    "03-16": [
      { name: "Gabriel Attal", blurb: "homme politique (1989)" },
      { name: "Marine Lorphelin", blurb: "Miss France 2013 (1993)" }
    ],
    "03-17": [
      { name: "José Garcia", blurb: "acteur (1966)" },
      { name: "Jérémy Frérot", blurb: "chanteur (1990)" }
    ],
    "03-18": [
      { name: "Luc Besson", blurb: "réalisateur (1959)" },
      { name: "EnjoyPhoenix", blurb: "vidéaste beauté et lifestyle (1995)" }
    ],
    "03-19": [
      { name: "Bruce Willis", blurb: "acteur (1955)" }
    ],
    "03-20": [
      { name: "Philippe Croizon", blurb: "nageur et aventurier (1968)" },
      { name: "Harry Roselmack", blurb: "journaliste (1973)" }
    ],
    "03-21": [
      { name: "Ayrton Senna", blurb: "pilote de Formule 1 (1960)" },
      { name: "Antoine Griezmann", blurb: "footballeur (1991)" }
    ],
    "03-22": [
      { name: "Charles Pfizer", blurb: "industriel pharmaceutique (1824)" },
      { name: "Marcel Marceau", blurb: "mime (1923)" }
    ],
    "03-23": [
      { name: "Pierre Palmade", blurb: "humoriste (1968)" },
      { name: "Chantal Lauby", blurb: "actrice et humoriste (1957)" }
    ],
    "03-24": [
      { name: "Harry Houdini", blurb: "magicien (1874)" },
      { name: "Corneille", blurb: "chanteur (1977)" },
      { name: "Raphaël Mezrahi", blurb: "humoriste (1964)" }
    ],
    "03-25": [
      { name: "Bernard de la Villardière", blurb: "journaliste et animateur (1958)" },
      { name: "Elton John", blurb: "chanteur et pianiste (1947)" }
    ],
    "03-26": [
      { name: "Roch Voisine", blurb: "chanteur (1963)" },
      { name: "Jennifer Grey", blurb: "actrice (1960)" }
    ],
    "03-27": [
      { name: "Kad Merad", blurb: "acteur (1964)" },
      { name: "Quentin Tarantino", blurb: "réalisateur (1963)" }
    ],
    "03-28": [
      { name: "Lady Gaga", blurb: "chanteuse (1986)" },
      { name: "Benjamin Castaldi", blurb: "animateur de télévision (1970)" }
    ],
    "03-29": [
      { name: "André Bouchet", blurb: "comédien (Passe-Partout de Fort Boyard) (1967)" },
      { name: "Christophe Lambert", blurb: "acteur (1957)" }
    ],
    "03-30": [
      { name: "Céline Dion", blurb: "chanteuse (1968)" },
      { name: "Vincent Van Gogh", blurb: "peintre (1853)" },
      { name: "Paul Verlaine", blurb: "poète (1844)" }
    ],
    "03-31": [
      { name: "Jean-Sébastien Bach", blurb: "compositeur (1685)" },
      { name: "René Descartes", blurb: "philosophe (1596)" }
    ],
    "04-01": [
      { name: "Vincent Bolloré", blurb: "homme d'affaires (1952)" },
      { name: "Edmond Rostand", blurb: "écrivain (Cyrano de Bergerac) (1868)" }
    ],
    "04-02": [
      { name: "Serge Gainsbourg", blurb: "chanteur et compositeur (1928)" },
      { name: "Casanova", blurb: "aventurier et écrivain (1725)" },
      { name: "Émile Zola", blurb: "écrivain (1840)" }
    ],
    "04-03": [
      { name: "Blanche Gardin", blurb: "humoriste (1977)" },
      { name: "Eddie Murphy", blurb: "acteur et humoriste (1961)" }
    ],
    "04-04": [
      { name: "Robert Downey Jr", blurb: "acteur (1965)" },
      { name: "Bernard Campan", blurb: "acteur et humoriste (1958)" }
    ],
    "04-05": [
      { name: "Vanessa Demouy", blurb: "actrice (1973)" },
      { name: "Charlotte de Turckheim", blurb: "actrice et humoriste (1955)" }
    ],
    "04-06": [
      { name: "Hugo Travers", blurb: "vidéaste et journaliste (1997)" },
      { name: "Jérémy Ferrari", blurb: "humoriste (1985)" }
    ],
    "04-07": [
      { name: "Franck Ribéry", blurb: "footballeur (1983)" },
      { name: "Jackie Chan", blurb: "acteur (1954)" },
      { name: "Yves Rocher", blurb: "industriel des cosmétiques (1930)" }
    ],
    "04-08": [
      { name: "Jacques Brel", blurb: "chanteur (1929)" },
      { name: "Marion Séclin", blurb: "comédienne et vidéaste (1990)" }
    ],
    "04-09": [
      { name: "Céline Tran", blurb: "autrice et réalisatrice (1979)" },
      { name: "André Manoukian", blurb: "musicien et animateur (1957)" },
      { name: "Jean-Paul Belmondo", blurb: "acteur (1933)" }
    ],
    "04-10": [
      { name: "Guillaume Canet", blurb: "acteur et réalisateur (1973)" },
      { name: "Joseph Pulitzer", blurb: "éditeur de presse (1847)" }
    ],
    "04-11": [
      { name: "Nicoletta", blurb: "chanteuse (1944)" },
      { name: "James Parkinson", blurb: "médecin (1755)" }
    ],
    "04-12": [
      { name: "Jérôme Commandeur", blurb: "humoriste (1976)" },
      { name: "Jean-Louis Aubert", blurb: "chanteur (Téléphone) (1955)" }
    ],
    "04-13": [
      { name: "Garry Kasparov", blurb: "champion d'échecs (1963)" },
      { name: "Brigitte Macron", blurb: "ancienne enseignante et Première dame (1953)" }
    ],
    "04-14": [
      { name: "Guillaume Bats", blurb: "humoriste (1987)" },
      { name: "Brigitte Lecordier", blurb: "comédienne de doublage (voix de Goku) (1967)" }
    ],
    "04-15": [
      { name: "Emma Watson", blurb: "actrice (1990)" },
      { name: "Léonard de Vinci", blurb: "peintre et inventeur (1452)" }
    ],
    "04-16": [
      { name: "Michel Blanc", blurb: "acteur (1952)" },
      { name: "Charlie Chaplin", blurb: "acteur et réalisateur (1889)" }
    ],
    "04-17": [
      { name: "Victoria Beckham", blurb: "chanteuse et styliste (1974)" },
      { name: "Jo-Wilfried Tsonga", blurb: "joueur de tennis (1985)" }
    ],
    "04-18": [
      { name: "Zazie", blurb: "chanteuse (1964)" },
      { name: "Frankie Vincent", blurb: "chanteur (1956)" },
      { name: "Laurent Baffie", blurb: "humoriste (1958)" }
    ],
    "04-19": [
      { name: "Oli", blurb: "rappeur (Bigflo & Oli) (1996)" },
      { name: "Gad Elmaleh", blurb: "humoriste (1971)" }
    ],
    "04-20": [
      { name: "Adolf Hitler", blurb: "dictateur allemand (1889)" },
      { name: "Alexander Zverev", blurb: "joueur de tennis (1997)" }
    ],
    "04-21": [
      { name: "Élisabeth II", blurb: "reine du Royaume-Uni (1926)" },
      { name: "Nicolas Bedos", blurb: "réalisateur et acteur (1979)" }
    ],
    "04-22": [
      { name: "Sam Altman", blurb: "dirigeant dans l'intelligence artificielle (1985)" },
      { name: "Olivier Véran", blurb: "médecin et homme politique (1980)" },
      { name: "Robert Oppenheimer", blurb: "physicien (1904)" },
      { name: "Emmanuel Kant", blurb: "philosophe (1724)" }
    ],
    "04-23": [
      { name: "Wejdene", blurb: "chanteuse (2004)" },
      { name: "Michael Moore", blurb: "réalisateur (1954)" }
    ],
    "04-24": [
      { name: "Véronique Sanson", blurb: "chanteuse (1949)" },
      { name: "Jean-Paul Gaultier", blurb: "couturier (1952)" },
      { name: "Mano Solo", blurb: "chanteur (1963)" },
      { name: "Barbra Streisand", blurb: "chanteuse et actrice (1942)" }
    ],
    "04-25": [
      { name: "Al Pacino", blurb: "acteur (1940)" },
      { name: "Dominique Strauss-Kahn", blurb: "économiste et homme politique (1949)" }
    ],
    "04-26": [
      { name: "William Shakespeare", blurb: "dramaturge (1564)" },
      { name: "Laurent Ournac", blurb: "acteur (1980)" }
    ],
    "04-27": [
      { name: "Arielle Dombasle", blurb: "actrice et chanteuse (1953)" },
      { name: "Samuel Morse", blurb: "inventeur (code Morse) (1791)" }
    ],
    "04-28": [
      { name: "Jacques Dutronc", blurb: "chanteur et acteur (1943)" },
      { name: "Gérard Majax", blurb: "magicien (1943)" }
    ],
    "04-29": [
      { name: "Bernard Madoff", blurb: "financier (1938)" },
      { name: "Jean Rochefort", blurb: "acteur (1930)" }
    ],
    "04-30": [
      { name: "Jacky", blurb: "animateur de télévision (1948)" }
    ],
    "05-01": [
      { name: "Zaz", blurb: "chanteuse (1980)" },
      { name: "Catherine Frot", blurb: "actrice (1956)" }
    ],
    "05-02": [
      { name: "Édouard Balladur", blurb: "ancien Premier ministre (1929)" },
      { name: "Lorie Pester", blurb: "chanteuse (1982)" }
    ],
    "05-03": [
      { name: "Jean Lassalle", blurb: "homme politique (1955)" },
      { name: "James Brown", blurb: "chanteur de soul (1933)" }
    ],
    "05-04": [
      { name: "Rocco Siffredi", blurb: "acteur de films pour adultes (1964)" },
      { name: "Gérard Jugnot", blurb: "acteur et réalisateur (1951)" },
      { name: "Dave", blurb: "chanteur (1944)" }
    ],
    "05-05": [
      { name: "Chantal Ladesou", blurb: "humoriste et comédienne (1948)" },
      { name: "Carlos Alcaraz", blurb: "joueur de tennis (2003)" }
    ],
    "05-06": [
      { name: "Gims", blurb: "chanteur (1986)" },
      { name: "Christian Clavier", blurb: "acteur (1952)" },
      { name: "Sigmund Freud", blurb: "fondateur de la psychanalyse (1856)" }
    ],
    "05-07": [
      { name: "MrBeast", blurb: "vidéaste (1998)" },
      { name: "Gary Cooper", blurb: "acteur (1901)" }
    ],
    "05-08": [
      { name: "Benoît Paire", blurb: "joueur de tennis (1989)" },
      { name: "Laurence Boccolini", blurb: "animatrice de télévision (1963)" },
      { name: "Fernandel", blurb: "acteur (1903)" }
    ],
    "05-09": [
      { name: "Pierre Desproges", blurb: "humoriste (1939)" },
      { name: "Marie-José Pérec", blurb: "athlète (1968)" }
    ],
    "05-10": [
      { name: "Doc Gyneco", blurb: "rappeur (1974)" },
      { name: "Bono", blurb: "chanteur (U2) (1960)" }
    ],
    "05-11": [
      { name: "Renaud", blurb: "chanteur (1952)" },
      { name: "Dalí", blurb: "peintre (1904)" },
      { name: "Isabelle Mergault", blurb: "actrice et réalisatrice (1958)" }
    ],
    "05-12": [
      { name: "Cyprien Iov", blurb: "vidéaste (1989)" },
      { name: "Olivier Lejeune", blurb: "humoriste (1951)" }
    ],
    "05-13": [
      { name: "Robert Pattinson", blurb: "acteur (1986)" },
      { name: "Nikos Aliagas", blurb: "animateur de télévision (1969)" }
    ],
    "05-14": [
      { name: "Mark Zuckerberg", blurb: "fondateur de Facebook (1984)" },
      { name: "Patrick Bruel", blurb: "chanteur et acteur (1959)" },
      { name: "Michel Cymes", blurb: "médecin et animateur (1957)" },
      { name: "George Lucas", blurb: "réalisateur (Star Wars) (1944)" }
    ],
    "05-15": [
      { name: "Anaïs Delva", blurb: "chanteuse (1986)" },
      { name: "Arletty", blurb: "actrice (1898)" }
    ],
    "05-16": [
      { name: "Raphaël Quenard", blurb: "acteur (1991)" }
    ],
    "05-17": [
      { name: "Léon Marchand", blurb: "nageur (2002)" },
      { name: "Jean-Marie Bigard", blurb: "humoriste (1954)" }
    ],
    "05-18": [
      { name: "Yannick Noah", blurb: "joueur de tennis et chanteur (1960)" },
      { name: "Bernadette Chirac", blurb: "femme politique (1933)" }
    ],
    "05-19": [
      { name: "Sophie Davant", blurb: "animatrice de télévision (1963)" },
      { name: "Aurélien Barrau", blurb: "astrophysicien (1973)" }
    ],
    "05-20": [
      { name: "Samuel Étienne", blurb: "journaliste et animateur (1971)" },
      { name: "Honoré de Balzac", blurb: "écrivain (1799)" }
    ],
    "05-21": [
      { name: "Antoine de Maximy", blurb: "animateur et réalisateur (1959)" },
      { name: "Jeffrey Dahmer", blurb: "tueur en série (1960)" }
    ],
    "05-22": [
      { name: "Novak Djokovic", blurb: "joueur de tennis (1987)" },
      { name: "Arthur Conan Doyle", blurb: "écrivain (Sherlock Holmes) (1859)" }
    ],
    "05-23": [
      { name: "Baptiste Lecaplain", blurb: "humoriste (1985)" },
      { name: "Michel-Édouard Leclerc", blurb: "chef d'entreprise (1952)" }
    ],
    "05-24": [
      { name: "Éric Cantona", blurb: "footballeur et acteur (1966)" },
      { name: "Bob Dylan", blurb: "chanteur (1941)" },
      { name: "Jean-Pierre Bacri", blurb: "acteur (1951)" }
    ],
    "05-25": [
      { name: "François Bayrou", blurb: "homme politique (1951)" },
      { name: "Ian McKellen", blurb: "acteur (1939)" }
    ],
    "05-26": [
      { name: "Lenny Kravitz", blurb: "chanteur (1964)" },
      { name: "John Wayne", blurb: "acteur (1907)" }
    ],
    "05-27": [
      { name: "Lily-Rose Depp", blurb: "actrice (1999)" },
      { name: "Alain Souchon", blurb: "chanteur (1944)" }
    ],
    "05-28": [
      { name: "Romain Duris", blurb: "acteur (1974)" },
      { name: "Bernard Mabille", blurb: "humoriste (1953)" },
      { name: "Sylvie Tellier", blurb: "ancienne Miss France et dirigeante (1978)" }
    ],
    "05-29": [
      { name: "Catherine Lara", blurb: "chanteuse et violoniste (1945)" },
      { name: "John Fitzgerald Kennedy", blurb: "président des États-Unis (1917)" }
    ],
    "05-30": [
      { name: "Élise Lucet", blurb: "journaliste (1963)" },
      { name: "Olivier Delacroix", blurb: "animateur et journaliste (1964)" }
    ],
    "05-31": [
      { name: "Doc Seven", blurb: "vidéaste (1991)" },
      { name: "François Rollin", blurb: "humoriste (1953)" },
      { name: "Clint Eastwood", blurb: "acteur et réalisateur (1930)" }
    ],
    "06-01": [
      { name: "Morgan Freeman", blurb: "acteur (1937)" },
      { name: "Marilyn Monroe", blurb: "actrice (1926)" }
    ],
    "06-02": [
      { name: "Maïté", blurb: "cuisinière et animatrice (1938)" },
      { name: "Le Marquis de Sade", blurb: "écrivain (1740)" }
    ],
    "06-03": [
      { name: "Rafael Nadal", blurb: "joueur de tennis (1986)" },
      { name: "Julie Gayet", blurb: "actrice (1972)" }
    ],
    "06-04": [
      { name: "Angelina Jolie", blurb: "actrice (1975)" },
      { name: "Antoine", blurb: "chanteur et navigateur (1944)" }
    ],
    "06-05": [
      { name: "Cécilia Cara", blurb: "chanteuse et comédienne (1984)" },
      { name: "Guy Carlier", blurb: "chroniqueur (1952)" }
    ],
    "06-06": [
      { name: "Faudel", blurb: "chanteur (1978)" },
      { name: "Guillaume Musso", blurb: "écrivain (1974)" }
    ],
    "06-07": [
      { name: "Fabrice Eboué", blurb: "humoriste (1977)" },
      { name: "Prince", blurb: "chanteur (1958)" }
    ],
    "06-08": [
      { name: "Nancy Sinatra", blurb: "chanteuse (1940)" },
      { name: "Robert Schumann", blurb: "compositeur (1810)" }
    ],
    "06-09": [
      { name: "Michael J. Fox", blurb: "acteur (1961)" },
      { name: "Johnny Depp", blurb: "acteur (1963)" }
    ],
    "06-10": [
      { name: "Michaël Gregorio", blurb: "imitateur et chanteur (1985)" },
      { name: "Chantal Goya", blurb: "chanteuse (1942)" }
    ],
    "06-11": [
      { name: "Sébastien Lecornu", blurb: "homme politique (1986)" },
      { name: "Hugh Laurie", blurb: "acteur (1959)" },
      { name: "Jacques-Yves Cousteau", blurb: "océanographe (1910)" }
    ],
    "06-12": [
      { name: "Denis Brogniart", blurb: "animateur de télévision (1967)" },
      { name: "Anne Frank", blurb: "autrice du Journal (1929)" }
    ],
    "06-13": [
      { name: "Ashley Olsen", blurb: "actrice (1986)" },
      { name: "Mary-Kate Olsen", blurb: "actrice (1986)" }
    ],
    "06-14": [
      { name: "Guillaume Meurice", blurb: "humoriste (1981)" },
      { name: "Donald Trump", blurb: "président des États-Unis (1946)" },
      { name: "Che Guevara", blurb: "révolutionnaire (1928)" },
      { name: "Alois Alzheimer", blurb: "psychiatre (1864)" }
    ],
    "06-15": [
      { name: "Philippe Boxho", blurb: "médecin légiste et auteur (1965)" },
      { name: "Michèle Laroque", blurb: "actrice (1960)" },
      { name: "Johnny Hallyday", blurb: "chanteur (1943)" },
      { name: "Lisa Gherardini", blurb: "modèle présumé de La Joconde (1479)" }
    ],
    "06-16": [
      { name: "Jonathan Cohen", blurb: "humoriste et acteur (1980)" },
      { name: "Alexandre Astier", blurb: "acteur et réalisateur (Kaamelott) (1974)" },
      { name: "Bénabar", blurb: "chanteur (1969)" }
    ],
    "06-17": [
      { name: "Lio", blurb: "chanteuse (1962)" }
    ],
    "06-18": [
      { name: "Benjamin Brillaud (nota)", blurb: "vidéaste de vulgarisation historique (Nota Bene) (1988)" },
      { name: "Ambre Chalumeau", blurb: "chroniqueuse (1997)" },
      { name: "Jamel Debbouze", blurb: "humoriste (1975)" }
    ],
    "06-19": [
      { name: "Jean Dujardin", blurb: "acteur (1972)" },
      { name: "Anne Hidalgo", blurb: "maire de Paris (1959)" },
      { name: "Philippe Manœuvre", blurb: "journaliste rock (1954)" }
    ],
    "06-20": [
      { name: "Amir", blurb: "chanteur (1984)" },
      { name: "Jean-Marie Le Pen", blurb: "homme politique (1928)" }
    ],
    "06-21": [
      { name: "Amel Bent", blurb: "chanteuse (1985)" },
      { name: "Manu Chao", blurb: "chanteur (1961)" },
      { name: "Jean-Paul Sartre", blurb: "philosophe (1905)" }
    ],
    "06-22": [
      { name: "Dan Brown", blurb: "écrivain (1964)" },
      { name: "Nicola Sirkis", blurb: "chanteur (Indochine) (1959)" }
    ],
    "06-23": [
      { name: "Zinédine Zidane", blurb: "footballeur (1972)" },
      { name: "Pierre-Jean Chalençon", blurb: "collectionneur et personnalité de télévision (1970)" },
      { name: "Alan Turing", blurb: "mathématicien, pionnier de l'informatique (1912)" }
    ],
    "06-24": [
      { name: "Lionel Messi", blurb: "footballeur (1987)" },
      { name: "Brigitte Fontaine", blurb: "chanteuse (1939)" },
      { name: "Jean-Luc Delarue", blurb: "animateur de télévision (1964)" }
    ],
    "06-25": [
      { name: "Philippe Lacheau", blurb: "acteur et réalisateur (1980)" },
      { name: "Bruno Guillon", blurb: "animateur de radio et télévision (1970)" }
    ],
    "06-26": [
      { name: "Garou", blurb: "chanteur (1972)" },
      { name: "Dany Boon", blurb: "humoriste et réalisateur (1966)" }
    ],
    "06-27": [
      { name: "Tobey Maguire", blurb: "acteur (1975)" },
      { name: "Isabelle Adjani", blurb: "actrice (1955)" }
    ],
    "06-28": [
      { name: "Elon Musk", blurb: "entrepreneur (1971)" },
      { name: "Fabien Barthez", blurb: "footballeur (1971)" }
    ],
    "06-29": [
      { name: "Antoine de Saint-Exupéry", blurb: "écrivain et aviateur (1900)" },
      { name: "Georges Wolinski", blurb: "dessinateur de presse (1934)" }
    ],
    "06-30": [
      { name: "Patrick Baud (CaPe)", blurb: "vidéaste et auteur (Axolot) (1979)" },
      { name: "Mike Tyson", blurb: "boxeur (1966)" },
      { name: "Gaspard Proust", blurb: "humoriste (1976)" }
    ],
    "07-01": [
      { name: "Kev Adams", blurb: "humoriste et acteur (1991)" },
      { name: "Pamela Anderson", blurb: "actrice (1967)" },
      { name: "George Sand", blurb: "écrivaine (1804)" }
    ],
    "07-02": [
      { name: "Samy Naceri", blurb: "acteur (1961)" },
      { name: "Line Renaud", blurb: "chanteuse et actrice (1928)" }
    ],
    "07-03": [
      { name: "Kendji Girac", blurb: "chanteur (1996)" },
      { name: "Tom Cruise", blurb: "acteur (1962)" },
      { name: "Eddy Mitchell", blurb: "chanteur (1942)" }
    ],
    "07-04": [
      { name: "Tahar Rahim", blurb: "acteur (1981)" },
      { name: "Victoria Abril", blurb: "actrice (1959)" }
    ],
    "07-05": [
      { name: "Laura Laune", blurb: "humoriste (1990)" },
      { name: "Phineas Taylor Barnum", blurb: "entrepreneur de spectacle (1810)" },
      { name: "Dolly", blurb: "première brebis clonée (1996)" }
    ],
    "07-06": [
      { name: "Sylvester Stallone", blurb: "acteur (1946)" },
      { name: "Dalaï Lama", blurb: "chef spirituel tibétain (1935)" },
      { name: "Frida Kahlo", blurb: "peintre (1907)" }
    ],
    "07-07": [
      { name: "Fary", blurb: "humoriste (1991)" },
      { name: "Julien Doré", blurb: "chanteur (1982)" }
    ],
    "07-08": [
      { name: "Mimie Mathy", blurb: "humoriste et comédienne (1957)" },
      { name: "Jean de la Fontaine", blurb: "fabuliste (1621)" }
    ],
    "07-09": [
      { name: "Amélie Nothomb", blurb: "écrivaine (1966)" },
      { name: "Tom Hanks", blurb: "acteur (1956)" },
      { name: "Paul Ricard", blurb: "industriel (pastis) (1909)" }
    ],
    "07-10": [
      { name: "Marcel Proust", blurb: "écrivain (1871)" },
      { name: "Nikola Tesla", blurb: "inventeur (1856)" }
    ],
    "07-11": [
      { name: "Cheb Mami", blurb: "chanteur (1966)" },
      { name: "Giorgio Armani", blurb: "couturier (1934)" }
    ],
    "07-12": [
      { name: "Domingo", blurb: "animateur et vidéaste (1994)" },
      { name: "Bill Cosby", blurb: "acteur (1937)" }
    ],
    "07-13": [
      { name: "Bruno Salomone", blurb: "humoriste et acteur (1970)" },
      { name: "Harrison Ford", blurb: "acteur (1942)" },
      { name: "Simone Veil", blurb: "femme politique (1927)" }
    ],
    "07-14": [
      { name: "Dorothée", blurb: "animatrice de télévision et chanteuse (1953)" },
      { name: "Valérie Pécresse", blurb: "femme politique (1967)" }
    ],
    "07-15": [
      { name: "Patrick Timsit", blurb: "humoriste (1959)" },
      { name: "Rembrandt", blurb: "peintre (1606)" }
    ],
    "07-16": [
      { name: "Mike Horn", blurb: "aventurier (1966)" },
      { name: "Christophe Rocancourt", blurb: "escroc (1967)" }
    ],
    "07-17": [
      { name: "David Hasselhoff", blurb: "acteur (1952)" },
      { name: "Cécile de France", blurb: "actrice (1975)" },
      { name: "Michel Field", blurb: "journaliste et animateur (1954)" }
    ],
    "07-18": [
      { name: "Vin Diesel", blurb: "acteur (1967)" },
      { name: "Henri Salvador", blurb: "chanteur (1917)" }
    ],
    "07-19": [
      { name: "Sinclair", blurb: "chanteur (1970)" },
      { name: "Benedict Cumberbatch", blurb: "acteur (1976)" }
    ],
    "07-20": [
      { name: "Inès Reg", blurb: "humoriste (1992)" },
      { name: "Énora Malagré", blurb: "animatrice et chroniqueuse (1980)" },
      { name: "Francis Blanche", blurb: "acteur et humoriste (1921)" },
      { name: "Olivier de Kersauson", blurb: "navigateur (1944)" },
      { name: "Carlos Santana", blurb: "guitariste (1947)" }
    ],
    "07-21": [
      { name: "Robin Williams", blurb: "acteur et humoriste (1951)" },
      { name: "Charlotte Gainsbourg", blurb: "actrice et chanteuse (1971)" }
    ],
    "07-22": [
      { name: "Selena Gomez", blurb: "chanteuse et actrice (1992)" },
      { name: "Mireille Mathieu", blurb: "chanteuse (1946)" }
    ],
    "07-23": [
      { name: "Daniel Radcliffe", blurb: "acteur (1989)" },
      { name: "Slash", blurb: "guitariste (Guns N' Roses) (1965)" }
    ],
    "07-24": [
      { name: "Éric Tabarly", blurb: "navigateur (1931)" },
      { name: "Alexandre Dumas", blurb: "écrivain (1802)" }
    ],
    "07-25": [
      { name: "Diam's", blurb: "rappeuse (1980)" },
      { name: "Eric Judor", blurb: "acteur et humoriste (1969)" }
    ],
    "07-26": [
      { name: "Guillaume Pley", blurb: "animateur de radio (1981)" },
      { name: "Stanley Kubrick", blurb: "réalisateur (1928)" }
    ],
    "07-27": [
      { name: "Bourvil", blurb: "acteur et chanteur (1917)" },
      { name: "Taïg Khris", blurb: "champion de roller (1975)" }
    ],
    "07-28": [
      { name: "Anne-Élisabeth Blateau", blurb: "actrice (Scènes de ménages) (1976)" },
      { name: "Alexis Le Rossignol", blurb: "humoriste (1984)" }
    ],
    "07-29": [
      { name: "Anne-Élisabeth Lemoine", blurb: "animatrice de télévision (1976)" },
      { name: "Albin Michel", blurb: "éditeur (1873)" }
    ],
    "07-30": [
      { name: "Laury Thilleman", blurb: "Miss France 2011 et animatrice (1991)" },
      { name: "Simon Baker", blurb: "acteur (1969)" },
      { name: "Lisa Kudrow", blurb: "actrice (1963)" },
      { name: "Jean Reno", blurb: "acteur (1948)" },
      { name: "Arnold Schwarzenegger", blurb: "acteur et homme politique (1947)" }
    ],
    "07-31": [
      { name: "Grand Corps Malade", blurb: "slameur (1977)" },
      { name: "J. K. Rowling", blurb: "romancière (Harry Potter) (1965)" },
      { name: "Louis de Funès", blurb: "acteur (1914)" }
    ],
    "08-01": [
      { name: "Orelsan", blurb: "rappeur (1982)" },
      { name: "Mouloud Achour", blurb: "animateur et journaliste (1979)" },
      { name: "Mac Lesggy", blurb: "animateur de vulgarisation scientifique (1961)" }
    ],
    "08-02": [
      { name: "Pomme", blurb: "chanteuse (1996)" },
      { name: "Messmer", blurb: "hypnotiseur (1971)" },
      { name: "Muriel Robin", blurb: "humoriste et comédienne (1955)" },
      { name: "Wes Craven", blurb: "réalisateur (1939)" }
    ],
    "08-03": [
      { name: "Christophe Willem", blurb: "chanteur (1983)" },
      { name: "Lambert Wilson", blurb: "acteur (1958)" }
    ],
    "08-04": [
      { name: "Barack Obama", blurb: "président des États-Unis (1961)" },
      { name: "Bruno Coquatrix", blurb: "directeur de l'Olympia (1910)" }
    ],
    "08-05": [
      { name: "Jarry", blurb: "humoriste (1979)" },
      { name: "Marine Le Pen", blurb: "femme politique (1968)" },
      { name: "Jean-Marc Morandini", blurb: "animateur de télévision (1965)" },
      { name: "Abbé Pierre", blurb: "prêtre et fondateur d'Emmaüs (1912)" }
    ],
    "08-06": [
      { name: "Marc Lavoine", blurb: "chanteur et acteur (1962)" },
      { name: "Andy Warhol", blurb: "artiste du pop art (1928)" }
    ],
    "08-07": [
      { name: "Joyca", blurb: "vidéaste (1995)" },
      { name: "David Duchovny", blurb: "acteur (1960)" }
    ],
    "08-08": [
      { name: "Roger Federer", blurb: "joueur de tennis (1981)" },
      { name: "Francis Lalanne", blurb: "chanteur (1958)" },
      { name: "Gilles Verdez", blurb: "chroniqueur (1964)" }
    ],
    "08-09": [
      { name: "Audrey Tautou", blurb: "actrice (1976)" },
      { name: "Whitney Houston", blurb: "chanteuse (1963)" }
    ],
    "08-10": [
      { name: "Kylie Jenner", blurb: "femme d'affaires et personnalité de télé-réalité (1997)" },
      { name: "Jean Graton", blurb: "dessinateur (Michel Vaillant) (1923)" }
    ],
    "08-11": [
      { name: "Steve Wozniak", blurb: "cofondateur d'Apple (1950)" },
      { name: "Hulk Hogan", blurb: "catcheur (1953)" }
    ],
    "08-12": [
      { name: "François Hollande", blurb: "ancien président de la République (1954)" },
      { name: "Julien Lepers", blurb: "animateur de télévision (1951)" },
      { name: "Erwin Schrödinger", blurb: "physicien (1887)" }
    ],
    "08-13": [
      { name: "Booder", blurb: "humoriste (1978)" },
      { name: "Manuel Valls", blurb: "homme politique (1962)" },
      { name: "Alfred Hitchcock", blurb: "réalisateur (1899)" },
      { name: "Fidel Castro", blurb: "dirigeant cubain (1926)" }
    ],
    "08-14": [
      { name: "Mister V", blurb: "vidéaste et rappeur (1993)" },
      { name: "Emmanuelle Béart", blurb: "actrice (1963)" },
      { name: "David Hallyday", blurb: "chanteur (1966)" }
    ],
    "08-15": [
      { name: "Jennifer Lawrence", blurb: "actrice (1990)" },
      { name: "Sylvie Vartan", blurb: "chanteuse (1944)" },
      { name: "Alain Juppé", blurb: "homme politique (1945)" }
    ],
    "08-16": [
      { name: "Clovis Cornillac", blurb: "acteur (1967)" },
      { name: "Steve Carell", blurb: "acteur (1962)" },
      { name: "Madonna", blurb: "chanteuse (1958)" },
      { name: "Patrick Balkany", blurb: "homme politique (1948)" },
      { name: "Pierre Richard", blurb: "acteur (1934)" }
    ],
    "08-17": [
      { name: "Artus", blurb: "humoriste (1987)" },
      { name: "Robert De Niro", blurb: "acteur (1943)" }
    ],
    "08-18": [
      { name: "Mika", blurb: "chanteur (1983)" },
      { name: "Hugues Aufray", blurb: "chanteur (1929)" }
    ],
    "08-19": [
      { name: "Jean-Luc Mélenchon", blurb: "homme politique (1951)" },
      { name: "Bill Clinton", blurb: "président américain (1946)" },
      { name: "Matthew Perry", blurb: "acteur (1969)" }
    ],
    "08-20": [
      { name: "H.P. Lovecraft", blurb: "écrivain (1890)" },
      { name: "Robert Plant", blurb: "chanteur de Led Zeppelin (1948)" }
    ],
    "08-21": [
      { name: "Usain Bolt", blurb: "sprinteur (1986)" },
      { name: "Frédéric Mitterrand", blurb: "homme de télévision et ministre (1947)" }
    ],
    "08-22": [
      { name: "Jean-Pascal Zadi", blurb: "humoriste et réalisateur (1980)" },
      { name: "Laurent Lafitte", blurb: "acteur (1973)" }
    ],
    "08-23": [
      { name: "Sylvain Durif", blurb: "le « Christ cosmique » (1969)" },
      { name: "Michel Rocard", blurb: "Premier ministre (1930)" }
    ],
    "08-24": [
      { name: "Fabienne Carat", blurb: "actrice (1979)" },
      { name: "Paulo Coelho", blurb: "écrivain (1947)" },
      { name: "Léo Ferré", blurb: "chanteur (1916)" }
    ],
    "08-25": [
      { name: "Tim Burton", blurb: "réalisateur (1958)" },
      { name: "Sean Connery", blurb: "acteur (1930)" },
      { name: "Claudia Schiffer", blurb: "mannequin (1970)" }
    ],
    "08-26": [
      { name: "Mère Teresa", blurb: "religieuse (1910)" },
      { name: "Guillaume Apollinaire", blurb: "poète (1880)" },
      { name: "Macaulay Culkin", blurb: "acteur (1980)" }
    ],
    "08-27": [
      { name: "Cesária Évora", blurb: "chanteuse (1941)" },
      { name: "Darry Cowl", blurb: "acteur (1925)" }
    ],
    "08-28": [
      { name: "David Fincher", blurb: "réalisateur (1962)" },
      { name: "Goethe", blurb: "écrivain (1749)" }
    ],
    "08-29": [
      { name: "Michael Jackson", blurb: "chanteur (1958)" },
      { name: "Grichka Bogdanoff", blurb: "animateur de télévision (1949)" },
      { name: "Igor Bogdanoff", blurb: "animateur de télévision (1949)" },
      { name: "Kyan Khojandi", blurb: "humoriste (1982)" }
    ],
    "08-30": [
      { name: "Cameron Diaz", blurb: "actrice (1972)" },
      { name: "Laurent Delahousse", blurb: "journaliste (1969)" },
      { name: "Geneviève de Fontenay", blurb: "figure des Miss France (1932)" }
    ],
    "08-31": [
      { name: "Richard Gere", blurb: "acteur (1949)" },
      { name: "Vincent Delerm", blurb: "chanteur (1976)" },
      { name: "Éric Zemmour", blurb: "polémiste (1958)" },
      { name: "Maria Montessori", blurb: "pédagogue (1870)" }
    ]
  };

  // ─────────────────────────────────────────────────────────────
  // Fusion base "né comme" + ajouts enregistrés dans le back-office
  // ─────────────────────────────────────────────────────────────
  const mergedFor = (key) => {
    const base = birthdays[key] || [];
    const extra = additions
      .filter((a) => a.date_key === key)
      .map((a) => ({ name: a.label, blurb: a.year ? `(${a.year})` : '' }));
    return [...base, ...extra];
  };

  // ─── Saisie et validation de la date de naissance ───
  const handleBd = (field, value) => {
    const digits = value.replace(/\D/g, '').slice(0, field === 'y' ? 4 : 2);
    setBd((prev) => ({ ...prev, [field]: digits }));
    setDateErr('');
    if (field === 'd' && digits.length === 2 && monthRef.current) monthRef.current.focus();
    if (field === 'm' && digits.length === 2 && yearRef.current) yearRef.current.focus();
  };
  const validateBirth = () => {
    const d = parseInt(bd.d, 10), m = parseInt(bd.m, 10), y = parseInt(bd.y, 10);
    const t = todayParts();
    if (!bd.d || !bd.m || !bd.y || bd.y.length < 4) { setDateErr('Complétez le jour, le mois et l\'année (4 chiffres).'); return; }
    if (isNaN(y) || y < 1900 || y > t.y) { setDateErr(`Entrez une année entre 1900 et ${t.y}.`); return; }
    if (!isValidDate(d, m, y)) { setDateErr('Cette date n\'existe pas dans le calendrier. Vérifiez le jour et le mois.'); return; }
    if (Date.UTC(y, m - 1, d) > Date.UTC(t.y, t.m - 1, t.d)) { setDateErr('Cette date est dans le futur... pour l\'instant.'); return; }
    setBirth({ d, m, y });
    setView(null); setResults(null); setRevealing(false); setSouvenir(null); setDateErr('');
    playThinking();
  };
  const changeDate = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setBirth(null); setBd({ d: '', m: '', y: '' });
    setView(null); setResults(null); setRevealing(false); setSouvenir(null); setDateErr('');
  };

  // ─── Calcul du contenu de chaque vue ───
  const computeView = (v, b) => {
    if (v === 'age') {
      const n = computeAge(b.d, b.m, b.y);
      return { type: 'age', items: database[n] || [], q: { age: n } };
    }
    if (v === 'year') {
      return { type: 'year', items: yearEvents[b.y] || [], q: { year: b.y } };
    }
    if (v === 'day') {
      const key = `${pad(b.m)}-${pad(b.d)}`;
      return { type: 'day', items: mergedFor(key), q: { day: b.d, monthName: MONTHS[b.m - 1] } };
    }
    const z = zodiacOf(b.d, b.m);
    const nb = nextBirthday(b.d, b.m);
    const nbVal = nb.isToday
      ? 'C\'est aujourd\'hui. Joyeux anniversaire !'
      : `${cap(nb.weekday)} ${nb.d === 1 ? '1er' : nb.d} ${MONTHS[nb.m - 1]} ${nb.y}`;
    const nbSub = nb.isToday ? '' : `Dans ${fmtInt(nb.inDays)} jour${nb.inDays > 1 ? 's' : ''}${nb.note ? `, ${nb.note}` : ''}`;
    const items = [
      { label: 'Votre signe astrologique', value: `${z.sym} ${z.name}`, sub: '' },
      { label: 'Vous êtes né(e) un', value: cap(weekdayFR(b.d, b.m, b.y)), sub: `Le ${b.d === 1 ? '1er' : b.d} ${MONTHS[b.m - 1]} ${b.y} était un ${weekdayFR(b.d, b.m, b.y)}.` },
      { label: 'Votre prochain anniversaire', value: nbVal, sub: nbSub },
      { label: 'Jours vécus à ce jour', value: `${fmtInt(daysSince(b.d, b.m, b.y))} jours`, sub: 'Et chacun compte.' },
    ];
    return { type: 'more', items, q: {} };
  };

  // ─── Son (Tone.js), désactivable, démarré au 1er geste utilisateur ───
  const ensureAudio = async () => {
    try {
      await Tone.start();
      if (!synthRef.current) {
        const reverb = new Tone.Reverb({ decay: 1.6, wet: 0.22 }).toDestination();
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.004, decay: 0.18, sustain: 0, release: 0.3 },
          volume: -15,
        }).connect(reverb);
      }
      return synthRef.current;
    } catch { return null; }
  };
  const playThinking = async () => {
    if (!soundOn) return;
    const s = await ensureAudio(); if (!s) return;
    const t = Tone.now();
    s.triggerAttackRelease('C4', '32n', t);
    s.triggerAttackRelease('G4', '32n', t + 0.13);
  };
  const playReveal = async () => {
    if (!soundOn) return;
    const s = await ensureAudio(); if (!s) return;
    const t = Tone.now();
    ['C5', 'E5', 'G5', 'B5'].forEach((n, i) => s.triggerAttackRelease(n, '16n', t + i * 0.07));
  };

  // ─── Ouverture d'une vue avec petite mise en scène (tap pour passer) ───
  const selectView = (v) => {
    if (!birth) return;
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setView(v);
    pendingRef.current = computeView(v, birth);
    setResults(null);
    setSouvenir(null);
    setRevealing(true);
    playThinking();
    revealTimer.current = setTimeout(() => {
      setRevealing(false);
      setResults(pendingRef.current);
      playReveal();
    }, 700);
  };
  const finishReveal = () => {
    if (!revealing) return;
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setRevealing(false);
    setResults(pendingRef.current);
    playReveal();
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter') validateBirth(); };

  // ─── Carte-souvenir + partage ───
  const openSouvenir = () => {
    if (!results || !results.items || !results.items.length) return;
    setSouvenir({ type: results.type, items: results.items, q: results.q });
  };
  const closeSouvenir = () => setSouvenir(null);
  const souvenirKicker = (s) =>
    s.type === 'age' ? `À ${s.q.age} ans…`
    : s.type === 'year' ? `En ${s.q.year}…`
    : s.type === 'day' ? `Né(e) un ${s.q.day === 1 ? '1er' : s.q.day} ${s.q.monthName}…`
    : 'Ma date de naissance révèle…';
  const souvenirText = (s) => {
    const parts = s.items.map((it) => {
      if (s.type === 'age') return `${it.name} ${it.fact}`;
      if (s.type === 'year') return it.t;
      if (s.type === 'more') return `${it.label} : ${it.value}`;
      return it.blurb ? `${it.name} ${it.blurb.startsWith('(') ? it.blurb : `(${it.blurb})`}` : it.name;
    });
    return `Fabien Olicard m'a appris que, ${souvenirKicker(s).replace('…', '')} : ${parts.join(' · ')} @fabienolicard`;
  };

  // Petit logo Instagram dessiné au trait (pour l'image partagée)
  const drawInsta = (ctx, x, y, size, color) => {
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.085);
    roundRect(ctx, x, y, size, size, size * 0.28);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size * 0.25, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + size * 0.73, y + size * 0.27, size * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  // Génère l'image 1080x1920 (format story) regroupant les résultats de la vue
  const buildStoryImage = async (s) => {
    const W = 1080, H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    try { await document.fonts.ready; } catch { /* polices par défaut */ }

    // Fond dégradé aubergine + halo
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1B1226'); bg.addColorStop(1, '#0C0712');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 360, 60, W / 2, 360, 820);
    glow.addColorStop(0, 'rgba(58,39,80,0.6)'); glow.addColorStop(1, 'rgba(12,7,18,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    // Constellation discrète
    const pts = [];
    for (let i = 0; i < 16; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 3 + 1 });
    ctx.strokeStyle = 'rgba(143,230,245,0.10)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < 300) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    for (const p of pts) {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(176,240,251,0.5)'; ctx.shadowColor = 'rgba(143,230,245,0.8)'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
    }

    ctx.textAlign = 'center';

    // Phrase d'intro
    ctx.font = '600 40px Sora, sans-serif';
    ctx.fillStyle = '#DDF1F7'; ctx.shadowColor = 'rgba(143,230,245,0.4)'; ctx.shadowBlur = 20;
    ctx.fillText("Fabien Olicard m'a appris que", W / 2, 330);
    ctx.shadowBlur = 0;

    // Kicker
    ctx.font = '700 56px Sora, sans-serif';
    ctx.fillStyle = '#C3F2FB';
    ctx.fillText(souvenirKicker(s), W / 2, 450);

    // Prépare les lignes de chaque résultat
    const maxW = W - 200;
    const titleFont = '700 46px Sora, sans-serif';
    const bodyFont = '400 34px Sora, sans-serif';
    const tagFont = '700 26px Sora, sans-serif';
    const noteFont = '600 28px Sora, sans-serif';

    const source = s.type === 'year' ? s.items.slice(0, 3) : s.type === 'age' || s.type === 'day' ? s.items.slice(0, 4) : s.items;
    const items = source.map((it) => {
      if (s.type === 'age') return { tag: '', title: it.name, body: cap(it.fact), note: it.year || '' };
      if (s.type === 'year') return { tag: '', title: it.t, body: it.s, note: '' };
      if (s.type === 'more') return { tag: it.label.toUpperCase(), title: it.value, body: '', note: '' };
      return { tag: '', title: it.name, body: it.blurb ? cap(it.blurb.replace(/^\((.+)\)$/, '$1')) : '', note: '' };
    });

    const lineSets = items.map((it) => {
      const L = [];
      if (it.tag) L.push({ font: tagFont, text: it.tag, color: '#8FE6F5', lh: 48, ls: '4px' });
      if (it.title) { ctx.font = titleFont; for (const ln of wrapLines(ctx, it.title, maxW)) L.push({ font: titleFont, text: ln, color: '#FFFFFF', lh: 56, glow: true }); }
      if (it.body) { ctx.font = bodyFont; for (const ln of wrapLines(ctx, it.body, maxW)) L.push({ font: bodyFont, text: ln, color: 'rgba(236,245,248,0.86)', lh: 46 }); }
      if (it.note) L.push({ font: noteFont, text: it.note, color: '#C3F2FB', lh: 46 });
      return L;
    });

    const gap = 50;
    const heights = lineSets.map((L) => L.reduce((a, l) => a + l.lh, 0));
    const total = heights.reduce((a, h) => a + h, 0) + gap * Math.max(0, items.length - 1);
    const top = 560, bottom = 1700, avail = bottom - top;
    let y = top + Math.max(0, (avail - total) / 2) + 34;

    lineSets.forEach((L, idx) => {
      for (const l of L) {
        ctx.font = l.font; ctx.fillStyle = l.color;
        if (l.ls) ctx.letterSpacing = l.ls;
        if (l.glow) { ctx.shadowColor = 'rgba(143,230,245,0.25)'; ctx.shadowBlur = 14; }
        ctx.fillText(l.text, W / 2, y);
        ctx.shadowBlur = 0; if (l.ls) ctx.letterSpacing = '0px';
        y += l.lh;
      }
      if (idx < lineSets.length - 1) {
        y += gap * 0.4;
        ctx.fillStyle = 'rgba(143,230,245,0.55)';
        ctx.beginPath(); ctx.arc(W / 2, y - 6, 3, 0, Math.PI * 2); ctx.fill();
        y += gap * 0.6;
      }
    });

    // Signature : logo Instagram + @FABIENOLICARD
    const handle = '@FABIENOLICARD';
    ctx.font = '700 30px Sora, sans-serif';
    ctx.letterSpacing = '6px';
    const tw = ctx.measureText(handle).width;
    const icon = 40, gapSig = 22;
    const startX = (W - (icon + gapSig + tw)) / 2;
    const sigY = 1806;
    drawInsta(ctx, startX, sigY, icon, 'rgba(195,242,251,0.9)');
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(236,245,248,0.85)';
    ctx.fillText(handle, startX + icon + gapSig, sigY + icon - 9);
    ctx.letterSpacing = '0px';
    ctx.textAlign = 'center';
    ctx.font = '400 22px Sora, sans-serif';
    ctx.fillStyle = 'rgba(236,245,248,0.45)';
    ctx.fillText('Partagez et taguez-moi en story', W / 2, sigY + 82);

    return await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png', 0.95));
  };

  // Partage : image, feuille de partage native, ou repli pellicule
  const shareStory = async (s) => {
    let blob = null;
    try { blob = await buildStoryImage(s); } catch { blob = null; }
    const file = blob ? new File([blob], 'olicard-souvenir.png', { type: 'image/png' }) : null;

    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: souvenirText(s) });
        return;
      } catch { /* annulé : repli */ }
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'olicard-souvenir.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setToast('Image enregistrée ! Publiez-la et taguez @fabienolicard 📲');
      setTimeout(() => setToast(''), 3200);
      return;
    }
    try {
      await navigator.clipboard.writeText(souvenirText(s));
      setToast('Texte copié !'); setTimeout(() => setToast(''), 1800);
    } catch { /* rien */ }
  };

  // ─────────────────────────────────────────────────────────────
  // Actions du back-office
  // ─────────────────────────────────────────────────────────────
  const analyzePaste = () => { setAdmMsg(''); setParsed(parseAdditions(pasteText)); };
  const saveAdditions = async () => {
    if (!parsed || !parsed.ok.length) return;
    if (!SUPA_ON) { setAdmMsg('Supabase n\'est pas encore configuré : les ajouts ne peuvent pas être enregistrés. Suis la procédure d\'installation.'); return; }
    setSaveBusy(true); setAdmMsg('');
    try {
      const rows = parsed.ok.map((p) => ({ date_key: p.date_key, label: p.label, year: p.year }));
      const { error } = await supabase.from('birthday_additions').insert(rows);
      if (error) setAdmMsg(`Erreur d'enregistrement : ${error.message}`);
      else {
        setAdmMsg(`${rows.length} ajout${rows.length > 1 ? 's' : ''} enregistré${rows.length > 1 ? 's' : ''}. Ils sont en ligne pour tout le monde.`);
        setPasteText(''); setParsed(null);
        loadShared();
      }
    } catch (e) { setAdmMsg('Erreur réseau pendant l\'enregistrement.'); }
    setSaveBusy(false);
  };
  const deleteAddition = async (id) => {
    if (!SUPA_ON) return;
    try {
      await supabase.from('birthday_additions').delete().eq('id', id);
      setAdditions((prev) => prev.filter((a) => a.id !== id));
    } catch (e) { /* silencieux */ }
  };
  const saveTour = async () => {
    const val = tourDraft.trim();
    if (!val) { setAdmMsg('Le lien ne peut pas être vide.'); return; }
    setSaveBusy(true); setAdmMsg('');
    if (SUPA_ON) {
      try {
        const { error } = await supabase.from('app_settings').upsert({ key: 'tour_url', value: val, updated_at: new Date().toISOString() });
        if (error) setAdmMsg(`Erreur : ${error.message}`);
        else { setTourUrl(val); setAdmMsg('Lien de la tournée enregistré. Il est actif pour tous les visiteurs.'); }
      } catch (e) { setAdmMsg('Erreur réseau pendant l\'enregistrement.'); }
    } else {
      setTourUrl(val);
      try { localStorage.setItem('fab_tour_url', val); } catch (e) {}
      setAdmMsg('Supabase non configuré : lien enregistré sur cet appareil uniquement.');
    }
    setSaveBusy(false);
  };

  // Générateurs d'entraînement
  const randDate = () => {
    const total = 366;
    let r = Math.floor(Math.random() * total) + 1;
    let m = 1;
    while (r > daysInMonth(m, 2024)) { r -= daysInMonth(m, 2024); m += 1; }
    setGenDate({ d: r, m }); setGenDateShow(false);
  };
  const randYearGen = () => { setGenYear(1950 + Math.floor(Math.random() * 77)); setGenYearShow(false); };
  const randFull = () => {
    const y = 1950 + Math.floor(Math.random() * 62); // 1950 à 2011 : âges couverts par l'app
    const m = 1 + Math.floor(Math.random() * 12);
    const d = 1 + Math.floor(Math.random() * daysInMonth(m, y));
    setGenFull({ d, m, y }); setGenFullShow(false);
  };
  const fullAnalysis = (b) => ({
    weekday: weekdayFR(b.d, b.m, b.y),
    age: computeAge(b.d, b.m, b.y),
    zodiac: zodiacOf(b.d, b.m),
    days: daysSince(b.d, b.m, b.y),
    ageItems: database[computeAge(b.d, b.m, b.y)] || [],
    yearItems: yearEvents[b.y] || [],
    dayItems: mergedFor(`${pad(b.m)}-${pad(b.d)}`),
  });

  // Nettoyage du timer au démontage
  useEffect(() => () => { if (revealTimer.current) clearTimeout(revealTimer.current); }, []);

  // ─────────────────────────────────────────────────────────────
  // Fond "constellation" animé (nœuds cyan reliés), motif de l'affiche
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, nodes = [], raf;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const init = () => {
      const count = Math.max(28, Math.min(60, Math.floor((w * h) / 22000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.5 + 0.5,
        tw: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy; a.tw += 0.02;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(143,230,245,${(1 - d / 130) * 0.13})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        const glow = 0.35 + Math.sin(n.tw) * 0.25;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(176,240,251,${glow})`;
        ctx.shadowColor = 'rgba(143,230,245,0.9)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(draw);
    };

    resize(); init(); draw();
    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600;700;800&family=Spectral:ital,wght@1,400;1,500&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap');

    .albert-root{
      --bg-0:#0C0712; --bg-1:#181023; --bg-2:#241634;
      --cyan:#8FE6F5; --cyan-2:#C3F2FB; --cyan-soft:rgba(143,230,245,.7);
      --ink:#ECF5F8; --muted:rgba(236,245,248,.5);
      --card:rgba(255,255,255,.04); --brd:rgba(143,230,245,.16);
      position:relative; min-height:100vh; min-height:100dvh; width:100%; overflow-x:hidden;
      -webkit-tap-highlight-color:transparent;
      font-family:'Sora',ui-sans-serif,system-ui,sans-serif; color:var(--ink);
      background:
        radial-gradient(130% 90% at 50% 26%, rgba(58,39,80,.55), rgba(12,7,18,0) 58%),
        radial-gradient(120% 70% at 50% 118%, rgba(143,230,245,.07), rgba(12,7,18,0) 55%),
        linear-gradient(180deg,#181023 0%,#0C0712 100%);
    }
    .albert-canvas{ position:fixed; inset:0; width:100%; height:100%; z-index:0; }
    .albert-vignette{
      position:fixed; inset:0; z-index:1; pointer-events:none;
      background:radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(7,4,11,.7) 100%);
    }
    .albert-wrap{ position:relative; z-index:2; max-width:760px; margin:0 auto; box-sizing:border-box;
      min-height:100vh; min-height:100dvh; display:flex; flex-direction:column; justify-content:center;
      padding:calc(env(safe-area-inset-top, 0px) + clamp(40px,9vw,76px)) 20px calc(env(safe-area-inset-bottom, 0px) + 64px); }

    .a-present{ text-align:center; font-size:11px; letter-spacing:.42em; text-transform:uppercase;
      color:var(--muted); margin-bottom:14px; font-weight:400; }
    .a-present b{ color:rgba(236,245,248,.78); font-weight:600; letter-spacing:.42em; }

    .a-brand{ text-align:center; font-weight:800; letter-spacing:.1em; line-height:1;
      font-size:clamp(26px,7vw,46px); color:#DDF1F7;
      text-shadow:0 0 26px rgba(143,230,245,.4), 0 0 2px rgba(143,230,245,.55);
      margin-bottom:clamp(20px,5vw,34px); }

    .a-hero{ position:relative; text-align:center; margin-bottom:10px; }
    .a-hero h1{
      display:inline-block; position:relative; margin:0; max-width:94%;
      font-family:'Bricolage Grotesque','Sora',sans-serif;
      font-weight:800; letter-spacing:.004em; font-size:clamp(42px,11vw,82px); line-height:1.0;
      color:#E8F5F9; -webkit-text-stroke:0;
      text-shadow:0 0 28px rgba(143,230,245,.45), 0 0 3px rgba(143,230,245,.45);
    }
    .a-node{ position:absolute; width:9px; height:9px; border-radius:50%;
      background:var(--cyan-2); box-shadow:0 0 10px 2px var(--cyan-soft), 0 0 22px 6px rgba(143,230,245,.4);
      animation:nodepulse 3.6s ease-in-out infinite; }
    @keyframes nodepulse{ 0%,100%{ transform:scale(1); opacity:.85 } 50%{ transform:scale(1.35); opacity:1 } }

    .a-tagline{ text-align:center; font-family:'Spectral',serif; font-style:italic;
      font-size:clamp(15px,3.4vw,19px); color:rgba(236,245,248,.74); line-height:1.5;
      max-width:420px; margin:18px auto clamp(34px,7vw,52px); }

    .a-panel{ position:relative; border:1px solid var(--brd); border-radius:20px;
      background:linear-gradient(180deg, rgba(143,230,245,.05), rgba(255,255,255,.02));
      backdrop-filter:blur(10px); padding:22px; box-shadow:0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.04); }
    .a-label{ display:block; font-size:11px; letter-spacing:.22em; text-transform:uppercase;
      color:var(--cyan-soft); margin-bottom:12px; font-weight:600; }
    .a-row{ display:flex; gap:12px; flex-direction:column; }
    @media(min-width:560px){ .a-row{ flex-direction:row; align-items:stretch; } }

    .a-input-wrap{ position:relative; flex:1; }
    .a-input{ width:100%; box-sizing:border-box; background:rgba(8,5,14,.55);
      border:1.5px solid rgba(143,230,245,.22); border-radius:14px; color:var(--ink);
      font-family:'Sora',sans-serif; font-size:22px; font-weight:600; letter-spacing:.02em;
      padding:16px 18px; outline:none; transition:border-color .2s, box-shadow .2s; -moz-appearance:textfield; }
    .a-input::-webkit-outer-spin-button,.a-input::-webkit-inner-spin-button{ -webkit-appearance:none; margin:0; }
    .a-input::placeholder{ color:rgba(236,245,248,.28); font-weight:400; }
    .a-input:focus{ border-color:var(--cyan); box-shadow:0 0 0 4px rgba(143,230,245,.12), 0 0 26px rgba(143,230,245,.25); }

    .a-btn{ display:inline-flex; align-items:center; justify-content:center; gap:9px;
      border:none; cursor:pointer; border-radius:14px; padding:16px 26px;
      font-family:'Sora',sans-serif; font-weight:700; font-size:15px; letter-spacing:.04em; color:#06212A;
      background:linear-gradient(135deg,#C3F2FB,#8FE6F5 55%,#5FD2EC);
      box-shadow:0 8px 26px rgba(143,230,245,.35), inset 0 1px 0 rgba(255,255,255,.5);
      transition:transform .15s, box-shadow .2s; white-space:nowrap; }
    .a-btn:hover{ transform:translateY(-2px); box-shadow:0 12px 34px rgba(143,230,245,.5); }
    .a-btn:active{ transform:translateY(0); }

    .a-results{ margin-top:22px; display:flex; flex-direction:column; gap:14px; }
    .a-card{ position:relative; border:1px solid var(--brd); border-radius:18px; padding:20px 22px 20px 26px;
      background:linear-gradient(180deg, rgba(143,230,245,.045), rgba(255,255,255,.015));
      backdrop-filter:blur(8px); overflow:hidden;
      opacity:0; transform:translateY(14px); animation:rise .5s cubic-bezier(.2,.7,.2,1) forwards; }
    .a-card::before{ content:''; position:absolute; left:0; top:18px; bottom:18px; width:2px; border-radius:2px;
      background:linear-gradient(180deg,var(--cyan),rgba(143,230,245,0)); box-shadow:0 0 12px rgba(143,230,245,.6); }
    @keyframes rise{ to{ opacity:1; transform:translateY(0) } }
    .a-card-name{ display:flex; align-items:center; gap:10px; font-weight:700; font-size:20px; color:#F4FBFD; margin:0 0 8px; letter-spacing:.01em; }
    .a-dot{ width:8px; height:8px; border-radius:50%; background:var(--cyan-2);
      box-shadow:0 0 8px 2px var(--cyan-soft); flex:0 0 auto; }
    .a-card-fact{ font-size:16px; line-height:1.55; color:rgba(236,245,248,.82); margin:0; }
    .a-card-fact .hl{ color:#fff; font-weight:600; }
    .a-year{ display:inline-block; margin-top:12px; font-size:12px; letter-spacing:.08em; font-weight:600;
      color:var(--cyan-2); border:1px solid rgba(143,230,245,.28); border-radius:999px; padding:5px 12px;
      background:rgba(143,230,245,.06); }

    .a-newage{ margin-top:12px; text-align:center; }
    .a-newage button{ background:transparent; border:1px solid rgba(143,230,245,.35); color:var(--cyan-2);
      font-family:'Sora',sans-serif; font-weight:600; font-size:14px; letter-spacing:.04em; cursor:pointer;
      border-radius:999px; padding:12px 26px; transition:background .2s, box-shadow .2s, transform .15s; }
    .a-newage button:hover{ background:rgba(143,230,245,.1); box-shadow:0 0 26px rgba(143,230,245,.25); transform:translateY(-2px); }

    .a-state{ margin-top:22px; text-align:center; border:1px solid var(--brd); border-radius:18px; padding:30px 22px;
      background:rgba(255,255,255,.025); backdrop-filter:blur(8px); color:rgba(236,245,248,.78); font-size:15px; }
    .a-state.err{ border-color:rgba(255,120,120,.4); background:rgba(255,90,90,.07); color:#ffd9d9; }
    .a-state .ic{ font-size:30px; display:block; margin-bottom:10px; }

    .a-tabs{ display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-bottom:18px; }
    .a-tab{ display:inline-flex; align-items:center; gap:7px; cursor:pointer;
      border:1px solid rgba(143,230,245,.25); background:rgba(255,255,255,.02); color:rgba(236,245,248,.68);
      font-family:'Sora',sans-serif; font-weight:600; font-size:13px; letter-spacing:.02em; padding:10px 16px;
      border-radius:999px; transition:border-color .2s, color .2s, background .2s, box-shadow .2s; }
    .a-tab:hover{ border-color:rgba(143,230,245,.5); color:var(--cyan-2); }
    .a-tab.active{ background:linear-gradient(135deg,rgba(195,242,251,.18),rgba(143,230,245,.1));
      border-color:var(--cyan); color:#fff; box-shadow:0 0 22px rgba(143,230,245,.22); }

    .a-subrow{ display:flex; gap:12px; flex:1; min-width:0; }
    .a-select{ flex:1; min-width:0; box-sizing:border-box; background:rgba(8,5,14,.55);
      border:1.5px solid rgba(143,230,245,.22); border-radius:14px; color:var(--ink);
      font-family:'Sora',sans-serif; font-size:16px; font-weight:600; padding:16px 18px; outline:none;
      cursor:pointer; transition:border-color .2s, box-shadow .2s; }
    .a-select:focus{ border-color:var(--cyan); box-shadow:0 0 0 4px rgba(143,230,245,.12); }
    .a-select option{ background:#181023; color:var(--ink); }

    .a-rhead{ text-align:center; font-family:'Spectral',serif; font-style:italic; color:var(--cyan-2);
      font-size:clamp(17px,4vw,20px); margin:26px 0 2px; letter-spacing:.01em; }

    .a-note{ max-width:440px; margin:18px auto 0; text-align:center; font-size:13px; line-height:1.65;
      color:rgba(236,245,248,.5); }
    .a-note b{ color:var(--cyan-2); font-weight:600; }
    .a-note .star{ color:var(--cyan-soft); }
    .a-scope{ display:inline-block; font-size:11px; letter-spacing:.14em; text-transform:uppercase; font-weight:700;
      color:var(--cyan-2); border:1px solid rgba(143,230,245,.3); border-radius:6px; padding:3px 9px;
      margin-bottom:10px; background:rgba(143,230,245,.07); }

    /* Bouton son */
    .a-sound{ position:fixed; top:calc(env(safe-area-inset-top, 0px) + 14px); right:calc(env(safe-area-inset-right, 0px) + 14px); z-index:40; width:42px; height:42px; border-radius:50%;
      display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--cyan-2);
      border:1px solid rgba(143,230,245,.28); background:rgba(12,7,18,.5); backdrop-filter:blur(6px);
      transition:border-color .2s, box-shadow .2s; }
    .a-sound:hover{ border-color:var(--cyan); box-shadow:0 0 18px rgba(143,230,245,.3); }

    /* Indicateur de reveal */
    .a-reveal{ margin-top:28px; display:flex; flex-direction:column; align-items:center; gap:16px; padding:28px 0; cursor:pointer; }
    .a-orbit{ position:relative; width:54px; height:54px; }
    .a-orbit .ring{ position:absolute; inset:0; border-radius:50%; border:1px solid rgba(143,230,245,.55);
      animation:ping 1.1s ease-out infinite; }
    .a-orbit .ring.d2{ animation-delay:.45s; }
    .a-orbit .core{ position:absolute; inset:42%; border-radius:50%; background:var(--cyan-2);
      box-shadow:0 0 14px 3px var(--cyan-soft); animation:nodepulse 1.1s ease-in-out infinite; }
    @keyframes ping{ 0%{ transform:scale(.45); opacity:.85 } 100%{ transform:scale(1.35); opacity:0 } }
    .a-reveal-text{ font-family:'Spectral',serif; font-style:italic; color:var(--cyan-2); font-size:15px; letter-spacing:.04em; }

    /* Icône partage sur les cartes */
    .a-share{ position:absolute; top:14px; right:14px; width:34px; height:34px; border-radius:50%;
      display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--cyan-2);
      border:1px solid rgba(143,230,245,.25); background:rgba(143,230,245,.06); transition:all .2s; }
    .a-share:hover{ border-color:var(--cyan); background:rgba(143,230,245,.14); box-shadow:0 0 16px rgba(143,230,245,.25); }
    .a-card-name{ padding-right:0; }
    .a-share-all{ margin-top:22px; text-align:center; }
    .a-share-all button{ display:inline-flex; align-items:center; justify-content:center; gap:9px; cursor:pointer;
      border:none; border-radius:14px; padding:15px 32px; color:#06212A; font-family:'Sora',sans-serif; font-weight:700; font-size:15px;
      background:linear-gradient(135deg,#C3F2FB,#8FE6F5 55%,#5FD2EC); box-shadow:0 8px 26px rgba(143,230,245,.35);
      transition:transform .15s, box-shadow .2s; }
    .a-share-all button:hover{ transform:translateY(-2px); box-shadow:0 12px 34px rgba(143,230,245,.5); }

    /* Carte-souvenir */
    .a-souvenir{ position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center;
      padding:20px; background:rgba(6,4,11,.8); backdrop-filter:blur(8px); animation:fade .25s ease; }
    @keyframes fade{ from{opacity:0} to{opacity:1} }
    .s-card{ position:relative; width:100%; max-width:360px; border-radius:26px; padding:34px 26px 26px;
      border:1px solid rgba(143,230,245,.3); overflow:hidden;
      background:radial-gradient(120% 80% at 50% 0%, rgba(58,39,80,.7), rgba(12,7,18,0) 60%), linear-gradient(180deg,#1B1226,#0C0712);
      box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 0 50px rgba(143,230,245,.1);
      animation:rise .42s cubic-bezier(.2,.7,.2,1); }
    .s-x{ position:absolute; top:14px; right:14px; width:32px; height:32px; border-radius:50%; cursor:pointer;
      display:flex; align-items:center; justify-content:center; color:var(--muted);
      border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.04); transition:color .2s, border-color .2s; }
    .s-x:hover{ color:var(--cyan-2); border-color:rgba(143,230,245,.4); }
    .s-brand{ text-align:center; font-weight:700; letter-spacing:.03em; font-size:15px; color:#DDF1F7;
      text-shadow:0 0 16px rgba(143,230,245,.35); line-height:1.3; }
    .s-kicker{ text-align:center; font-family:'Sora',sans-serif; font-weight:600; color:#C3F2FB;
      font-size:19px; margin:14px 0 6px; letter-spacing:.01em; }
    .s-list{ max-height:46vh; overflow-y:auto; }
    .s-item{ padding:16px 0; border-bottom:1px solid rgba(143,230,245,.12); }
    .s-item:last-child{ border-bottom:none; }
    .s-name{ text-align:center; font-weight:700; font-size:21px; color:#fff; margin:0 0 7px; letter-spacing:.01em; }
    .s-fact{ text-align:center; font-size:15px; line-height:1.5; color:rgba(236,245,248,.85); margin:0; }
    .s-scope{ display:block; width:fit-content; margin:0 auto 8px; font-size:11px; letter-spacing:.14em; text-transform:uppercase;
      font-weight:700; color:var(--cyan-2); border:1px solid rgba(143,230,245,.3); border-radius:6px; padding:3px 9px; background:rgba(143,230,245,.07); }
    .s-year{ display:block; width:fit-content; margin:10px auto 0; font-size:12px; letter-spacing:.08em; font-weight:600;
      color:var(--cyan-2); border:1px solid rgba(143,230,245,.28); border-radius:999px; padding:5px 12px; background:rgba(143,230,245,.06); }
    .s-actions{ display:flex; gap:10px; margin-top:20px; }
    .s-actions button{ flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer;
      border-radius:13px; padding:14px; font-family:'Sora',sans-serif; font-weight:700; font-size:14px; transition:transform .15s, box-shadow .2s; }
    .s-share{ border:none; color:#06212A; background:linear-gradient(135deg,#C3F2FB,#8FE6F5 55%,#5FD2EC);
      box-shadow:0 8px 22px rgba(143,230,245,.32); }
    .s-share:hover{ transform:translateY(-2px); }
    .s-close{ border:1px solid rgba(143,230,245,.3); background:transparent; color:var(--cyan-2); }
    .s-close:hover{ background:rgba(143,230,245,.08); }
    .s-hint{ text-align:center; margin:14px 0 0; font-size:12px; color:var(--muted); letter-spacing:.02em; }

    /* Toast */
    .a-toast{ position:fixed; bottom:28px; left:50%; transform:translateX(-50%); z-index:60;
      background:rgba(12,7,18,.92); border:1px solid rgba(143,230,245,.35); color:var(--cyan-2);
      padding:12px 20px; border-radius:999px; font-size:14px; font-weight:600; backdrop-filter:blur(6px);
      box-shadow:0 10px 30px rgba(0,0,0,.5); animation:fade .2s ease; }

    /* ===== Back-office privé (/admin-fabien) ===== */
    .adm-card{ width:100%; max-width:384px; margin:0 auto; padding:32px 28px 26px; text-align:center;
      border:1px solid rgba(143,230,245,.18); border-radius:22px;
      background:linear-gradient(180deg, rgba(143,230,245,.055), rgba(255,255,255,.02));
      backdrop-filter:blur(12px); box-shadow:0 24px 70px rgba(0,0,0,.5); }
    .adm-badge{ display:inline-block; font-family:'Sora',sans-serif; font-size:11px; font-weight:600;
      letter-spacing:.14em; text-transform:uppercase; color:var(--cyan-2);
      border:1px solid rgba(143,230,245,.3); border-radius:999px; padding:5px 13px; background:rgba(143,230,245,.06); }
    .adm-title{ font-family:'Bricolage Grotesque','Sora',sans-serif; font-weight:700; font-size:30px;
      color:var(--ink); margin:16px 0 2px; letter-spacing:-.01em; }
    .adm-sub{ color:var(--muted); font-size:14px; margin:0 0 22px; }
    .adm-field{ margin-bottom:14px; text-align:left; }
    .adm-btn{ width:100%; margin-top:10px; justify-content:center; }
    .adm-back{ display:inline-block; margin-top:18px; color:var(--muted); font-size:13px;
      text-decoration:none; border-bottom:1px solid transparent; transition:color .2s, border-color .2s; }
    .adm-back:hover{ color:var(--cyan-2); border-color:rgba(143,230,245,.4); }
    .adm-shell{ width:100%; max-width:680px; margin:0 auto; }
    .adm-topbar{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
      padding-bottom:20px; margin-bottom:24px; border-bottom:1px solid rgba(143,230,245,.14); }
    .adm-logout{ flex:none; cursor:pointer; font-family:'Sora',sans-serif; font-size:13px; font-weight:600;
      color:var(--cyan-2); border:1px solid rgba(143,230,245,.3); border-radius:999px;
      padding:9px 16px; background:rgba(143,230,245,.06); transition:all .2s; }
    .adm-logout:hover{ background:rgba(143,230,245,.14); box-shadow:0 0 16px rgba(143,230,245,.2); }
    .adm-placeholder{ padding:36px 26px; border:1px dashed rgba(143,230,245,.25); border-radius:18px;
      background:rgba(143,230,245,.03); text-align:center; }
    .adm-ph-title{ font-family:'Sora',sans-serif; font-weight:600; font-size:18px; color:var(--ink); margin:0 0 10px; }
    .adm-ph-text{ color:var(--muted); font-size:15px; line-height:1.55; margin:0 auto; max-width:440px; }
    .adm-meta{ margin-top:24px; font-size:12px; color:rgba(236,245,248,.4); letter-spacing:.02em; }

    /* ===== Refonte "affiche Albert" : titre outline + points constellation ===== */
    .albert-root .a-hero h1{
      font-family:'Bricolage Grotesque','Sora',sans-serif;
      font-weight:800; letter-spacing:.045em;
      color:transparent; -webkit-text-stroke:2px #CBEFF8;
      text-shadow:0 0 34px rgba(143,230,245,.4);
      font-size:clamp(40px,10.4vw,84px);
    }
    @supports not (-webkit-text-stroke: 2px #fff){
      .albert-root .a-hero h1{ color:#E8F5F9; }
    }

    /* Saisie de la date de naissance */
    .a-bd-row{ display:flex; gap:10px; }
    .a-bd-row .a-input{ text-align:center; padding-left:8px; padding-right:8px; }
    .a-bd-d, .a-bd-m{ flex:1; min-width:0; }
    .a-bd-y{ flex:1.6; min-width:0; }
    .a-bd-sep{ align-self:center; color:rgba(236,245,248,.3); font-weight:700; }
    .a-validate{ width:100%; margin-top:14px; justify-content:center; }

    /* Bandeau date validée */
    .a-birthbar{ display:flex; align-items:center; justify-content:center; gap:14px; flex-wrap:wrap;
      margin-bottom:18px; }
    .a-birthbar .val{ font-family:'Spectral',serif; font-style:italic; font-size:clamp(17px,4.4vw,21px);
      color:#DDF1F7; letter-spacing:.01em; }
    .a-birthbar button{ background:transparent; border:1px solid rgba(143,230,245,.35); color:var(--cyan-2);
      font-family:'Sora',sans-serif; font-weight:600; font-size:12.5px; letter-spacing:.04em; cursor:pointer;
      border-radius:999px; padding:8px 16px; transition:background .2s, box-shadow .2s; }
    .a-birthbar button:hover{ background:rgba(143,230,245,.1); box-shadow:0 0 20px rgba(143,230,245,.25); }

    /* Grille des 4 vues */
    .a-views{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .a-view-btn{ display:flex; flex-direction:column; align-items:center; gap:9px; cursor:pointer;
      border:1px solid rgba(143,230,245,.22); border-radius:18px; padding:18px 10px 16px;
      background:linear-gradient(180deg, rgba(143,230,245,.05), rgba(255,255,255,.015));
      color:rgba(236,245,248,.85); font-family:'Sora',sans-serif; font-weight:600; font-size:14px;
      letter-spacing:.02em; text-align:center; backdrop-filter:blur(8px);
      transition:border-color .2s, box-shadow .2s, transform .15s, background .2s; }
    .a-view-btn svg{ color:var(--cyan-2); filter:drop-shadow(0 0 8px rgba(143,230,245,.5)); }
    .a-view-btn:hover{ transform:translateY(-2px); border-color:rgba(143,230,245,.5); }
    .a-view-btn.active{ border-color:var(--cyan); color:#fff;
      background:linear-gradient(135deg,rgba(195,242,251,.16),rgba(143,230,245,.07));
      box-shadow:0 0 26px rgba(143,230,245,.25); }

    /* Cartes "Et plus encore" */
    .a-more-label{ display:block; font-size:11px; letter-spacing:.2em; text-transform:uppercase;
      color:var(--cyan-soft); font-weight:700; margin:0 0 8px; }
    .a-more-value{ font-family:'Bricolage Grotesque','Sora',sans-serif; font-weight:700;
      font-size:clamp(21px,5.6vw,27px); color:#F4FBFD; margin:0; line-height:1.2;
      text-shadow:0 0 18px rgba(143,230,245,.3); }
    .a-more-sub{ margin:8px 0 0; font-size:13.5px; color:rgba(236,245,248,.6); line-height:1.5; }

    /* Cartes "Cette année-là" */
    .a-ev-title{ display:flex; align-items:center; gap:10px; font-weight:700; font-size:18px;
      color:#F4FBFD; margin:0 0 8px; letter-spacing:.01em; }

    /* Footer public : tournée + installation */
    .a-footer{ margin-top:clamp(40px,9vw,64px); display:flex; flex-direction:column; gap:14px; }
    .a-foot-card{ border:1px solid rgba(143,230,245,.18); border-radius:20px; padding:20px 22px;
      background:linear-gradient(180deg, rgba(143,230,245,.045), rgba(255,255,255,.015));
      backdrop-filter:blur(8px); text-align:center; }
    .a-foot-kicker{ font-size:11px; letter-spacing:.24em; text-transform:uppercase; font-weight:700;
      color:var(--cyan-soft); margin:0 0 6px; }
    .a-foot-title{ font-family:'Bricolage Grotesque','Sora',sans-serif; font-weight:700;
      font-size:clamp(18px,4.6vw,22px); color:#F4FBFD; margin:0 0 14px; }
    .a-foot-btn{ display:inline-flex; align-items:center; justify-content:center; gap:9px; cursor:pointer;
      border:none; border-radius:13px; padding:13px 24px; color:#06212A; font-family:'Sora',sans-serif;
      font-weight:700; font-size:14px; background:linear-gradient(135deg,#C3F2FB,#8FE6F5 55%,#5FD2EC);
      box-shadow:0 8px 24px rgba(143,230,245,.3); transition:transform .15s, box-shadow .2s; }
    .a-foot-btn:hover{ transform:translateY(-2px); box-shadow:0 12px 32px rgba(143,230,245,.45); }
    .a-foot-btn.ghost{ background:transparent; color:var(--cyan-2); border:1px solid rgba(143,230,245,.35);
      box-shadow:none; }
    .a-foot-btn.ghost:hover{ background:rgba(143,230,245,.08); }

    /* Modales génériques (tournée, installation) */
    .a-modal-card{ position:relative; width:100%; max-width:400px; max-height:86vh; overflow-y:auto;
      border-radius:26px; padding:30px 26px 26px; border:1px solid rgba(143,230,245,.3);
      background:radial-gradient(120% 80% at 50% 0%, rgba(58,39,80,.7), rgba(12,7,18,0) 60%), linear-gradient(180deg,#1B1226,#0C0712);
      box-shadow:0 30px 80px rgba(0,0,0,.6), inset 0 0 50px rgba(143,230,245,.08);
      animation:rise .42s cubic-bezier(.2,.7,.2,1); }
    .a-modal-title{ font-family:'Bricolage Grotesque','Sora',sans-serif; font-weight:700;
      font-size:22px; color:#F4FBFD; margin:0 0 14px; text-align:center; }
    .a-modal-text{ font-size:15px; line-height:1.65; color:rgba(236,245,248,.82); margin:0 0 10px; }
    .a-modal-actions{ display:flex; flex-direction:column; gap:10px; margin-top:20px; }
    .a-modal-actions .a-foot-btn{ width:100%; }

    /* Segments iPhone / Android */
    .a-seg{ display:flex; gap:8px; margin:4px 0 18px; }
    .a-seg button{ flex:1; cursor:pointer; border:1px solid rgba(143,230,245,.25); border-radius:12px;
      background:rgba(255,255,255,.02); color:rgba(236,245,248,.7); font-family:'Sora',sans-serif;
      font-weight:600; font-size:14px; padding:11px 0; transition:all .2s; }
    .a-seg button.active{ border-color:var(--cyan); color:#fff;
      background:linear-gradient(135deg,rgba(195,242,251,.16),rgba(143,230,245,.08));
      box-shadow:0 0 18px rgba(143,230,245,.2); }
    .a-steps{ margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:14px; }
    .a-steps li{ display:flex; gap:13px; align-items:flex-start; }
    .a-step-n{ flex:0 0 30px; width:30px; height:30px; border-radius:50%; display:flex; align-items:center;
      justify-content:center; font-weight:700; font-size:14px; color:#06212A;
      background:linear-gradient(135deg,#C3F2FB,#8FE6F5); box-shadow:0 0 14px rgba(143,230,245,.4); }
    .a-step-t{ font-size:14.5px; line-height:1.55; color:rgba(236,245,248,.85); padding-top:4px; }
    .a-step-t b{ color:#fff; }

    /* Lien Instagram sous la carte-souvenir */
    .s-insta{ display:flex; align-items:center; justify-content:center; gap:7px; margin:10px 0 0;
      color:var(--cyan-2); font-size:13px; font-weight:600; text-decoration:none; letter-spacing:.02em; }
    .s-insta:hover{ text-decoration:underline; }

    /* ===== Back-office : onglets et outils ===== */
    .adm-tabs{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:22px; }
    .adm-tab{ cursor:pointer; border:1px solid rgba(143,230,245,.25); background:rgba(255,255,255,.02);
      color:rgba(236,245,248,.68); font-family:'Sora',sans-serif; font-weight:600; font-size:13px;
      padding:9px 14px; border-radius:999px; display:inline-flex; align-items:center; gap:7px;
      transition:all .2s; }
    .adm-tab:hover{ border-color:rgba(143,230,245,.5); color:var(--cyan-2); }
    .adm-tab.active{ background:linear-gradient(135deg,rgba(195,242,251,.18),rgba(143,230,245,.1));
      border-color:var(--cyan); color:#fff; box-shadow:0 0 20px rgba(143,230,245,.2); }
    .adm-panel{ border:1px solid rgba(143,230,245,.16); border-radius:20px; padding:22px;
      background:linear-gradient(180deg, rgba(143,230,245,.04), rgba(255,255,255,.015));
      backdrop-filter:blur(8px); }
    .adm-h{ font-family:'Sora',sans-serif; font-weight:700; font-size:17px; color:#F4FBFD; margin:0 0 6px; }
    .adm-p{ color:rgba(236,245,248,.6); font-size:13.5px; line-height:1.6; margin:0 0 16px; }
    .adm-textarea{ width:100%; box-sizing:border-box; min-height:150px; resize:vertical;
      background:rgba(8,5,14,.55); border:1.5px solid rgba(143,230,245,.22); border-radius:14px;
      color:var(--ink); font-family:'Sora',sans-serif; font-size:14px; line-height:1.6; padding:14px 16px;
      outline:none; transition:border-color .2s, box-shadow .2s; }
    .adm-textarea:focus{ border-color:var(--cyan); box-shadow:0 0 0 4px rgba(143,230,245,.12); }
    .adm-actions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }
    .adm-msg{ margin-top:14px; font-size:13.5px; line-height:1.55; color:var(--cyan-2); }
    .adm-msg.err{ color:#ffd9d9; }
    .adm-list{ margin-top:18px; display:flex; flex-direction:column; gap:8px; max-height:340px; overflow-y:auto; }
    .adm-item{ display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:12px;
      border:1px solid rgba(143,230,245,.14); background:rgba(255,255,255,.02); font-size:14px; }
    .adm-item .k{ flex:0 0 auto; font-weight:700; color:var(--cyan-2); font-size:12.5px; letter-spacing:.04em; }
    .adm-item .n{ flex:1; color:rgba(236,245,248,.88); }
    .adm-item .y{ color:rgba(236,245,248,.5); font-size:13px; }
    .adm-item button{ flex:0 0 auto; cursor:pointer; border:none; background:transparent;
      color:rgba(255,150,150,.7); display:flex; padding:4px; border-radius:8px; transition:all .2s; }
    .adm-item button:hover{ color:#ff9d9d; background:rgba(255,120,120,.1); }

    /* Générateurs */
    .gen-display{ text-align:center; padding:30px 10px 26px; }
    .gen-big{ font-family:'Bricolage Grotesque','Sora',sans-serif; font-weight:800;
      font-size:clamp(38px,9vw,58px); color:transparent; -webkit-text-stroke:1.8px #CBEFF8;
      text-shadow:0 0 30px rgba(143,230,245,.35); letter-spacing:.04em; line-height:1.15; }
    @supports not (-webkit-text-stroke: 2px #fff){ .gen-big{ color:#E8F5F9; } }
    .gen-sub{ margin-top:10px; color:rgba(236,245,248,.55); font-size:14px; }
    .gen-answer{ margin-top:20px; text-align:left; }
    .gen-block{ margin-top:16px; }
    .gen-block h4{ font-size:11px; letter-spacing:.2em; text-transform:uppercase; font-weight:700;
      color:var(--cyan-soft); margin:0 0 8px; }
    .gen-block p{ font-size:14.5px; line-height:1.6; color:rgba(236,245,248,.85); margin:0 0 6px; }
    .gen-block p b{ color:#fff; }

    /* Révision */
    .rev-nav{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:16px; }
    .rev-year{ border-top:1px solid rgba(143,230,245,.14); padding-top:18px; margin-top:18px; }
    .rev-year:first-of-type{ border-top:none; margin-top:0; padding-top:0; }
    .rev-ytitle{ font-family:'Bricolage Grotesque','Sora',sans-serif; font-weight:800; font-size:26px;
      color:var(--cyan-2); margin:0 0 12px; text-shadow:0 0 18px rgba(143,230,245,.3); }
    .rev-ev{ margin:0 0 16px; }
    .rev-ev h4{ font-size:15.5px; font-weight:700; color:#F4FBFD; margin:0 0 6px; }
    .rev-ev p{ font-size:14px; line-height:1.65; color:rgba(236,245,248,.72); margin:0; }
    .rev-date{ margin:0 0 12px; padding:12px 14px; border-radius:12px;
      border:1px solid rgba(143,230,245,.13); background:rgba(255,255,255,.018); }
    .rev-dtitle{ font-weight:700; color:var(--cyan-2); font-size:14px; margin:0 0 6px; letter-spacing:.03em; }
    .rev-names{ font-size:14px; line-height:1.6; color:rgba(236,245,248,.85); margin:0; }
    .rev-names i{ color:rgba(236,245,248,.5); font-style:normal; }

  `;

  // ===== Rendu BACK-OFFICE (route privée /admin-fabien) =====
  if (isAdminRoute) {
    const admTabs = [
      { id: 'ajouts', label: 'Ajouts', Icon: ListPlus },
      { id: 'gdate', label: 'Jour + mois', Icon: Dices },
      { id: 'gyear', label: 'Année', Icon: Dices },
      { id: 'gfull', label: 'Date complète', Icon: CalendarDays },
      { id: 'revyears', label: 'Révision années', Icon: BookOpen },
      { id: 'revdays', label: 'Révision naissances', Icon: Cake },
      { id: 'reglages', label: 'Réglages', Icon: Settings },
    ];
    const yearsList = Object.keys(yearEvents).map(Number).sort((a, b) => a - b);
    const minY = yearsList[0], maxY = yearsList[yearsList.length - 1];
    const monthKeys = [];
    for (let d = 1; d <= daysInMonth(revMonth, 2024); d++) monthKeys.push(`${pad(revMonth)}-${pad(d)}`);
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const searchHits = revSearch.trim().length >= 2
      ? Array.from({ length: 12 }, (_, mi) => mi + 1).flatMap((mo) =>
          Array.from({ length: daysInMonth(mo, 2024) }, (_, di) => `${pad(mo)}-${pad(di + 1)}`)
            .map((k) => ({ k, items: mergedFor(k).filter((p) => norm(p.name).includes(norm(revSearch))) }))
            .filter((e) => e.items.length))
      : null;
    const keyLabel = (k) => { const [mo, dd] = k.split('-').map(Number); return `${dd === 1 ? '1er' : dd} ${MONTHS[mo - 1]}`; };
    const fa = genFull && genFullShow ? fullAnalysis(genFull) : null;

    return (
      <div className="albert-root">
        <style>{css}</style>
        <canvas ref={canvasRef} className="albert-canvas" />
        <div className="albert-vignette" />
        <div className="albert-wrap" style={{ justifyContent: 'flex-start' }}>
          {!adminAuth ? (
            <div className="adm-card" style={{ marginTop: 'clamp(30px, 12vh, 120px)' }}>
              <div className="adm-badge">Espace privé</div>
              <h1 className="adm-title">Back-office</h1>
              <p className="adm-sub">{SUPA_ON ? 'Connexion sécurisée Supabase' : 'Mode local (Supabase non configuré)'}</p>
              <div className="adm-field">
                <label className="a-label" htmlFor="adm-email">Email</label>
                <input
                  id="adm-email" className="a-input" type="email" autoComplete="username"
                  value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitAdminLogin()}
                  placeholder="vous@exemple.com"
                />
              </div>
              <div className="adm-field">
                <label className="a-label" htmlFor="adm-pass">Mot de passe</label>
                <input
                  id="adm-pass" className="a-input" type="password" autoComplete="current-password"
                  value={adminPass} onChange={(e) => setAdminPass(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitAdminLogin()}
                  placeholder="••••••••"
                />
              </div>
              {adminErr && <div className="a-state err" style={{ marginTop: 6 }}>{adminErr}</div>}
              <button className="a-btn adm-btn" onClick={submitAdminLogin} disabled={adminBusy}>
                {adminBusy ? 'Connexion…' : 'Se connecter'}
              </button>
              <a className="adm-back" href="/">← Retour au spectacle</a>
            </div>
          ) : (
            <div className="adm-shell" style={{ paddingTop: 10 }}>
              <div className="adm-topbar">
                <div>
                  <div className="adm-badge">Connecté</div>
                  <h1 className="adm-title" style={{ margin: '10px 0 0' }}>Back-office Fabien</h1>
                </div>
                <button className="adm-logout" onClick={adminLogout}><LogOut size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />Déconnexion</button>
              </div>

              <div className="adm-tabs">
                {admTabs.map((t) => (
                  <button key={t.id} className={`adm-tab ${admTab === t.id ? 'active' : ''}`} onClick={() => { setAdmTab(t.id); setAdmMsg(''); }}>
                    <t.Icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              {/* 1 · Enrichir la base "Vous êtes né comme" */}
              {admTab === 'ajouts' && (
                <div className="adm-panel">
                  <h3 className="adm-h">Enrichir « Vous êtes né comme »</h3>
                  <p className="adm-p">
                    Colle tes lignes au format habituel, une date par ligne :<br />
                    <b style={{ color: '#C3F2FB' }}>17/08 - Artus (1987), Robert De Niro (1943)</b><br />
                    Tu peux aussi préciser le métier, en minuscule après une virgule :
                    <b style={{ color: '#C3F2FB' }}> 17/08 - Artus, humoriste (1987)</b>.
                    Clique sur Analyser pour vérifier avant d'enregistrer.
                  </p>
                  <textarea
                    className="adm-textarea" value={pasteText}
                    onChange={(e) => { setPasteText(e.target.value); setParsed(null); }}
                    placeholder={"17/08 - Artus (1987), Robert De Niro (1943)\n18/08 - Mika (1983), Hugues Aufray (1929)"}
                  />
                  <div className="adm-actions">
                    <button className="a-btn" style={{ padding: '13px 22px' }} onClick={analyzePaste}><Search size={16} /> Analyser</button>
                    {parsed && parsed.ok.length > 0 && (
                      <button className="a-btn" style={{ padding: '13px 22px' }} onClick={saveAdditions} disabled={saveBusy}>
                        {saveBusy ? 'Enregistrement…' : `Enregistrer ${parsed.ok.length} ajout${parsed.ok.length > 1 ? 's' : ''}`}
                      </button>
                    )}
                  </div>
                  {parsed && (
                    <div className="adm-list">
                      {parsed.ok.map((p, i) => (
                        <div className="adm-item" key={`ok-${i}`}>
                          <span className="k">{keyLabel(p.date_key)}</span>
                          <span className="n">{p.label}</span>
                          <span className="y">{p.year || 'sans année'}</span>
                        </div>
                      ))}
                      {parsed.errors.map((er, i) => (
                        <div className="adm-item" key={`er-${i}`} style={{ borderColor: 'rgba(255,120,120,.35)' }}>
                          <span className="n" style={{ color: '#ffd9d9' }}>Ligne {er.line} : {er.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {admMsg && <p className={`adm-msg ${admMsg.startsWith('Erreur') || admMsg.startsWith('Supabase') ? 'err' : ''}`}>{admMsg}</p>}
                  <div style={{ marginTop: 22 }}>
                    <h3 className="adm-h" style={{ fontSize: 15 }}>Ajouts déjà enregistrés ({additions.length})</h3>
                    {!SUPA_ON && <p className="adm-p">Ils apparaîtront ici une fois Supabase configuré.</p>}
                    <div className="adm-list">
                      {additions.map((a) => (
                        <div className="adm-item" key={a.id}>
                          <span className="k">{keyLabel(a.date_key)}</span>
                          <span className="n">{a.label}</span>
                          <span className="y">{a.year || ''}</span>
                          <button onClick={() => deleteAddition(a.id)} aria-label="Supprimer"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2 · Générateur jour + mois */}
              {admTab === 'gdate' && (
                <div className="adm-panel">
                  <h3 className="adm-h">Entraînement mémoire : jour + mois</h3>
                  <p className="adm-p">Tirage au hasard parmi les 366 jours de l'année (29 février compris). Récite, puis vérifie.</p>
                  <div className="gen-display">
                    <div className="gen-big">{genDate ? `${genDate.d === 1 ? '1er' : genDate.d} ${MONTHS[genDate.m - 1]}` : '· · ·'}</div>
                    {genDate && genDateShow && (
                      <div className="gen-answer">
                        <div className="gen-block">
                          <h4>Nés ce jour ({mergedFor(`${pad(genDate.m)}-${pad(genDate.d)}`).length})</h4>
                          {mergedFor(`${pad(genDate.m)}-${pad(genDate.d)}`).map((p, i) => (
                            <p key={i}><b>{p.name}</b>{p.blurb ? (p.blurb.startsWith('(') ? ` ${p.blurb}` : `, ${p.blurb}`) : ''}</p>
                          ))}
                          {mergedFor(`${pad(genDate.m)}-${pad(genDate.d)}`).length === 0 && <p>Personne dans la base pour cette date.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="adm-actions" style={{ justifyContent: 'center' }}>
                    <button className="a-btn" style={{ padding: '13px 22px' }} onClick={randDate}><RefreshCw size={16} /> Nouvelle date</button>
                    {genDate && !genDateShow && (
                      <button className="a-btn" style={{ padding: '13px 22px' }} onClick={() => setGenDateShow(true)}><Eye size={16} /> Voir la réponse</button>
                    )}
                  </div>
                </div>
              )}

              {/* 3 · Générateur année */}
              {admTab === 'gyear' && (
                <div className="adm-panel">
                  <h3 className="adm-h">Entraînement mémoire : année</h3>
                  <p className="adm-p">Tirage au hasard entre 1950 et 2026. Récite les événements, puis vérifie.</p>
                  <div className="gen-display">
                    <div className="gen-big">{genYear || '· · · ·'}</div>
                    {genYear && genYearShow && (
                      <div className="gen-answer">
                        {(yearEvents[genYear] || []).map((ev, i) => (
                          <div className="gen-block" key={i}>
                            <h4>{ev.t}</h4>
                            <p>{ev.s}</p>
                          </div>
                        ))}
                        {!(yearEvents[genYear] || []).length && <p className="gen-sub">Aucun événement enregistré pour cette année.</p>}
                      </div>
                    )}
                  </div>
                  <div className="adm-actions" style={{ justifyContent: 'center' }}>
                    <button className="a-btn" style={{ padding: '13px 22px' }} onClick={randYearGen}><RefreshCw size={16} /> Nouvelle année</button>
                    {genYear && !genYearShow && (
                      <button className="a-btn" style={{ padding: '13px 22px' }} onClick={() => setGenYearShow(true)}><Eye size={16} /> Voir la réponse</button>
                    )}
                  </div>
                </div>
              )}

              {/* 4 · Générateur date de naissance complète */}
              {admTab === 'gfull' && (
                <div className="adm-panel">
                  <h3 className="adm-h">Entraînement mentalisme : date de naissance complète</h3>
                  <p className="adm-p">Tirage entre 1950 et 2011 (âges couverts par l'application), affiché année, puis mois, puis jour.</p>
                  <div className="gen-display">
                    <div className="gen-big">
                      {genFull ? `${genFull.y} · ${MONTHS[genFull.m - 1]} · ${genFull.d === 1 ? '1er' : genFull.d}` : '· · ·'}
                    </div>
                    {fa && genFull && (
                      <div className="gen-answer">
                        <div className="gen-block">
                          <h4>L'essentiel</h4>
                          <p>Né(e) un <b>{fa.weekday}</b> · Signe : <b>{fa.zodiac.sym} {fa.zodiac.name}</b></p>
                          <p>Âge aujourd'hui : <b>{fa.age} ans</b> · Jours vécus : <b>{fmtInt(fa.days)}</b></p>
                        </div>
                        <div className="gen-block">
                          <h4>Cette année-là ({genFull.y})</h4>
                          {fa.yearItems.map((ev, i) => <p key={i}><b>{ev.t}.</b> {ev.s}</p>)}
                          {!fa.yearItems.length && <p>Rien dans la base pour cette année.</p>}
                        </div>
                        <div className="gen-block">
                          <h4>Nés le même jour</h4>
                          {fa.dayItems.map((p, i) => (
                            <p key={i}><b>{p.name}</b>{p.blurb ? (p.blurb.startsWith('(') ? ` ${p.blurb}` : `, ${p.blurb}`) : ''}</p>
                          ))}
                          {!fa.dayItems.length && <p>Personne dans la base pour cette date.</p>}
                        </div>
                        <div className="gen-block">
                          <h4>À son âge ({fa.age} ans)</h4>
                          {fa.ageItems.map((p, i) => <p key={i}><b>{p.name}</b> {p.fact}{p.year ? ` (${p.year})` : ''}</p>)}
                          {!fa.ageItems.length && <p>Rien dans la base pour cet âge.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="adm-actions" style={{ justifyContent: 'center' }}>
                    <button className="a-btn" style={{ padding: '13px 22px' }} onClick={randFull}><RefreshCw size={16} /> Nouvelle date</button>
                    {genFull && !genFullShow && (
                      <button className="a-btn" style={{ padding: '13px 22px' }} onClick={() => setGenFullShow(true)}><Eye size={16} /> Vérifier</button>
                    )}
                  </div>
                </div>
              )}

              {/* 5 · Révision des années (briefs) */}
              {admTab === 'revyears' && (
                <div className="adm-panel">
                  <h3 className="adm-h">Révision « Cette année-là »</h3>
                  <p className="adm-p">Chaque événement avec son brief complet, année par année.</p>
                  <div className="rev-nav">
                    <button className="adm-tab" onClick={() => setRevYear((y) => Math.max(minY, y - 1))}>◀</button>
                    <select className="a-select" style={{ flex: '0 0 auto', padding: '10px 14px', fontSize: 15 }} value={revYear} onChange={(e) => setRevYear(parseInt(e.target.value, 10))}>
                      {yearsList.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button className="adm-tab" onClick={() => setRevYear((y) => Math.min(maxY, y + 1))}>▶</button>
                  </div>
                  <div className="rev-year">
                    <h3 className="rev-ytitle">{revYear}</h3>
                    {(yearEvents[revYear] || []).map((ev, i) => (
                      <div className="rev-ev" key={i}>
                        <h4>{ev.t}</h4>
                        <p>{ev.b}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6 · Révision "né comme" */}
              {admTab === 'revdays' && (
                <div className="adm-panel">
                  <h3 className="adm-h">Révision « Vous êtes né comme »</h3>
                  <p className="adm-p">Toute la base, mois par mois, ajouts compris. Ou recherche un nom directement.</p>
                  <div className="rev-nav">
                    <select className="a-select" style={{ flex: '0 0 auto', padding: '10px 14px', fontSize: 15 }} value={revMonth} onChange={(e) => { setRevMonth(parseInt(e.target.value, 10)); setRevSearch(''); }}>
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{cap(m)}</option>)}
                    </select>
                    <input className="a-input" style={{ flex: 1, minWidth: 140, padding: '10px 14px', fontSize: 15 }}
                      value={revSearch} onChange={(e) => setRevSearch(e.target.value)} placeholder="Rechercher un nom…" />
                  </div>
                  {searchHits ? (
                    searchHits.length ? searchHits.map((e) => (
                      <div className="rev-date" key={e.k}>
                        <p className="rev-dtitle">{cap(keyLabel(e.k))}</p>
                        <p className="rev-names">{e.items.map((p, i) => (
                          <span key={i}>{i > 0 && ' · '}<b>{p.name}</b>{p.blurb ? <i>{p.blurb.startsWith('(') ? ` ${p.blurb}` : `, ${p.blurb}`}</i> : null}</span>
                        ))}</p>
                      </div>
                    )) : <p className="adm-p">Aucun résultat pour « {revSearch} ».</p>
                  ) : (
                    monthKeys.map((k) => {
                      const items = mergedFor(k);
                      if (!items.length) return null;
                      return (
                        <div className="rev-date" key={k}>
                          <p className="rev-dtitle">{cap(keyLabel(k))}</p>
                          <p className="rev-names">{items.map((p, i) => (
                            <span key={i}>{i > 0 && ' · '}<b>{p.name}</b>{p.blurb ? <i>{p.blurb.startsWith('(') ? ` ${p.blurb}` : `, ${p.blurb}`}</i> : null}</span>
                          ))}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 7 · Réglages */}
              {admTab === 'reglages' && (
                <div className="adm-panel">
                  <h3 className="adm-h">Lien de la billetterie (bouton tournée)</h3>
                  <p className="adm-p">C'est la page qui s'ouvre quand un spectateur clique sur « Découvrir les dates ». Tu peux le changer quand tu veux.</p>
                  <input className="a-input" style={{ fontSize: 15 }} value={tourDraft} onChange={(e) => setTourDraft(e.target.value)} placeholder="https://…" />
                  <div className="adm-actions">
                    <button className="a-btn" style={{ padding: '13px 22px' }} onClick={saveTour} disabled={saveBusy}>{saveBusy ? 'Enregistrement…' : 'Enregistrer'}</button>
                    <a className="a-foot-btn ghost" href={tourDraft || tourUrl} target="_blank" rel="noreferrer noopener" style={{ textDecoration: 'none' }}><ExternalLink size={15} /> Tester le lien</a>
                  </div>
                  {admMsg && <p className={`adm-msg ${admMsg.startsWith('Erreur') || admMsg.startsWith('Supabase') ? 'err' : ''}`}>{admMsg}</p>}
                  <div className="adm-meta" style={{ marginTop: 26 }}>
                    Statut : {SUPA_ON ? 'Supabase connecté ✓ (ajouts et lien tournée partagés avec tous les visiteurs)' : 'Mode local, Supabase non configuré (voir la procédure d\'installation)'}
                    <br />Base : {Object.values(birthdays).flat().length} naissances + {additions.length} ajouts · {Object.values(yearEvents).flat().length} événements ({minY} à {maxY}) · {Object.values(database).flat().length} faits par âge
                    <br />Mot de passe : il se change dans Supabase (Authentication, puis Users), jamais dans le code.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const VIEW_BTNS = [
    { id: 'age', label: 'À votre âge', Icon: Hourglass },
    { id: 'year', label: 'Cette année-là', Icon: CalendarRange },
    { id: 'day', label: 'Vous êtes né comme…', Icon: Cake },
    { id: 'more', label: 'Et plus encore', Icon: Sparkles },
  ];
  const emptyMsg = results && results.type === 'age'
    ? `Pour ${results.q.age} ans, Fabien garde encore quelques secrets… Cette partie de la base s'enrichit bientôt.`
    : results && results.type === 'year'
      ? `Les archives de Fabien couvrent les naissances de 1950 à aujourd'hui. Pour ${results.q.year}, rien n'est encore écrit… ou déjà effacé.`
      : `Pas encore de données pour cette recherche ! Cette partie sera complétée prochainement par Fabien.`;

  return (
    <div className="albert-root">
      <style>{css}</style>
      <canvas ref={canvasRef} className="albert-canvas" />
      <div className="albert-vignette" />

      <button className="a-sound" onClick={() => setSoundOn((v) => !v)} aria-label={soundOn ? 'Couper le son' : 'Activer le son'}>
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      <div className="albert-wrap">
        <p className="a-present"><b>Fabien Olicard</b> présente</p>

        <div className="a-hero">
          <h1>
            EXPÉRIMENTE
            <span className="a-node" style={{ left: '3%',  top: '14%', animationDelay: '0s' }} />
            <span className="a-node" style={{ left: '50%', top: '-9%', animationDelay: '1.2s' }} />
            <span className="a-node" style={{ left: '97%', top: '22%', animationDelay: '.6s' }} />
            <span className="a-node" style={{ left: '7%',  top: '86%', animationDelay: '.9s' }} />
            <span className="a-node" style={{ left: '94%', top: '82%', animationDelay: '1.6s' }} />
          </h1>
        </div>

        <p className="a-tagline">
          Un voyage au cœur de la curiosité, de la science et du mentalisme
        </p>

        {!birth && (
          <>
            <div className="a-panel">
              <label className="a-label" htmlFor="bd-day">Votre date de naissance</label>
              <div className="a-bd-row">
                <input id="bd-day" ref={dayRef} className="a-input a-bd-d" type="text" inputMode="numeric" autoComplete="bday-day"
                  value={bd.d} onChange={(e) => handleBd('d', e.target.value)} onKeyDown={handleKeyDown} placeholder="JJ" aria-label="Jour" />
                <span className="a-bd-sep">/</span>
                <input ref={monthRef} className="a-input a-bd-m" type="text" inputMode="numeric" autoComplete="bday-month"
                  value={bd.m} onChange={(e) => handleBd('m', e.target.value)} onKeyDown={handleKeyDown} placeholder="MM" aria-label="Mois" />
                <span className="a-bd-sep">/</span>
                <input ref={yearRef} className="a-input a-bd-y" type="text" inputMode="numeric" autoComplete="bday-year"
                  value={bd.y} onChange={(e) => handleBd('y', e.target.value)} onKeyDown={handleKeyDown} placeholder="AAAA" aria-label="Année" />
              </div>
              <button className="a-btn a-validate" onClick={validateBirth}><Sparkles size={18} strokeWidth={2.4} /> Révéler</button>
              {dateErr && <div className="a-state err" style={{ marginTop: 14, padding: '16px 18px' }}>{dateErr}</div>}
            </div>

            <p className="a-note">
              <span className="star">✦</span> Entrez votre date de naissance et laissez l'application vous révéler
              ce qu'elle cache. Elle continuera de <b>s'enrichir de surprises</b> au fil des mois.
            </p>
          </>
        )}

        {birth && (
          <>
            <div className="a-birthbar">
              <span className="val">Né(e) le {birth.d === 1 ? '1er' : birth.d} {MONTHS[birth.m - 1]} {birth.y}</span>
              <button onClick={changeDate}>✦ Changer de date</button>
            </div>

            <div className="a-views">
              {VIEW_BTNS.map((v) => (
                <button key={v.id} className={`a-view-btn ${view === v.id ? 'active' : ''}`} onClick={() => selectView(v.id)}>
                  <v.Icon size={22} strokeWidth={2} />
                  {v.label}
                </button>
              ))}
            </div>

            {/* Mise en scène : reveal court (tap pour passer) */}
            {revealing && (
              <div className="a-reveal" onClick={finishReveal}>
                <div className="a-orbit">
                  <span className="ring" />
                  <span className="ring d2" />
                  <span className="core" />
                </div>
                <p className="a-reveal-text">Connexion des esprits…</p>
              </div>
            )}

            {/* Résultats */}
            {results && results.items.length > 0 && (
              <>
                <p className="a-rhead">
                  {results.type === 'age' && `Vous avez ${results.q.age} ans. À votre âge…`}
                  {results.type === 'year' && `En ${results.q.year}, l'année de votre naissance…`}
                  {results.type === 'day' && `Vous êtes né(e) un ${results.q.day === 1 ? '1er' : results.q.day} ${results.q.monthName}, comme…`}
                  {results.type === 'more' && `Votre date de naissance révèle…`}
                </p>
                <div className="a-results">
                  {results.items.map((it, i) => (
                    <div className="a-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                      {results.type === 'age' && (
                        <>
                          <h3 className="a-card-name"><span className="a-dot" />{it.name}</h3>
                          <p className="a-card-fact">
                            À votre âge, <span className="hl">{it.name}</span> {it.fact}
                          </p>
                          {it.year && <span className="a-year">{it.year}</span>}
                        </>
                      )}
                      {results.type === 'year' && (
                        <>
                          <h3 className="a-ev-title"><span className="a-dot" />{it.t}</h3>
                          <p className="a-card-fact">{it.s}</p>
                        </>
                      )}
                      {results.type === 'day' && (
                        <>
                          <h3 className="a-card-name"><span className="a-dot" />{it.name}</h3>
                          {it.blurb && (
                            <p className="a-card-fact">
                              <span className="hl">{it.name}</span>{it.blurb.startsWith('(') ? <> {it.blurb}</> : <>, {it.blurb}</>}
                            </p>
                          )}
                        </>
                      )}
                      {results.type === 'more' && (
                        <>
                          <span className="a-more-label">{it.label}</span>
                          <p className="a-more-value">{it.value}</p>
                          {it.sub && <p className="a-more-sub">{it.sub}</p>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="a-share-all">
                  <button onClick={openSouvenir}><Share2 size={17} /> Partager</button>
                </div>
              </>
            )}

            {/* Saisie valide mais base vide pour cette vue */}
            {results && results.items.length === 0 && (
              <div className="a-state">
                <span className="ic">✦</span>
                {emptyMsg}
              </div>
            )}
          </>
        )}

        {/* Pied de page : tournée + installation */}
        <div className="a-footer">
          <div className="a-foot-card">
            <p className="a-foot-kicker">Albert · Le spectacle</p>
            <p className="a-foot-title">Fabien est en tournée dans toute la France</p>
            <button className="a-foot-btn" onClick={() => setShowTour(true)}><Ticket size={16} /> Voir les dates et les villes</button>
          </div>
          <div className="a-foot-card">
            <p className="a-foot-kicker">L'application</p>
            <p className="a-foot-title">Gardez Expérimente dans votre poche</p>
            <button className="a-foot-btn ghost" onClick={() => setShowInstall(true)}><Smartphone size={16} /> Installer sur mon téléphone</button>
          </div>
        </div>
      </div>

      {/* Modale tournée */}
      {showTour && (
        <div className="a-souvenir" onClick={() => setShowTour(false)}>
          <div className="a-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="s-x" onClick={() => setShowTour(false)} aria-label="Fermer"><X size={18} /></button>
            <h3 className="a-modal-title">Une astuce avant d'y aller</h3>
            <p className="a-modal-text">
              Sur la page des dates, une barre de recherche vous permet d'entrer votre ville :
              vous verrez aussitôt s'il y a une représentation à moins de 50 km de chez vous.
            </p>
            <p className="a-modal-text">
              Rien ne s'affiche ? La date est peut-être déjà passée, ou prévue pour une prochaine
              saison… Et vous pouvez bien sûr venir voir le spectacle dans une autre ville !
            </p>
            <div className="a-modal-actions">
              <a className="a-foot-btn" href={tourUrl} target="_blank" rel="noreferrer noopener" style={{ textDecoration: 'none' }}>
                <ExternalLink size={16} /> Découvrir les dates
              </a>
              <button className="a-foot-btn ghost" onClick={() => setShowTour(false)}>Plus tard</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale installation */}
      {showInstall && (
        <div className="a-souvenir" onClick={() => setShowInstall(false)}>
          <div className="a-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="s-x" onClick={() => setShowInstall(false)} aria-label="Fermer"><X size={18} /></button>
            <h3 className="a-modal-title">Ajoutez l'appli à votre écran d'accueil</h3>
            <div className="a-seg">
              <button className={installOS === 'iphone' ? 'active' : ''} onClick={() => setInstallOS('iphone')}>iPhone</button>
              <button className={installOS === 'android' ? 'active' : ''} onClick={() => setInstallOS('android')}>Android</button>
            </div>
            {installOS === 'iphone' ? (
              <ol className="a-steps">
                <li><span className="a-step-n">1</span><span className="a-step-t">Ouvrez cette page dans <b>Safari</b>, le navigateur d'origine de l'iPhone (icône boussole bleue).</span></li>
                <li><span className="a-step-n">2</span><span className="a-step-t">Touchez le bouton <b>Partager</b> en bas de l'écran : le carré avec une flèche vers le haut.</span></li>
                <li><span className="a-step-n">3</span><span className="a-step-t">Faites défiler la liste, touchez <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>. C'est tout !</span></li>
              </ol>
            ) : (
              <ol className="a-steps">
                <li><span className="a-step-n">1</span><span className="a-step-t">Ouvrez cette page dans <b>Chrome</b>.</span></li>
                <li><span className="a-step-n">2</span><span className="a-step-t">Touchez les <b>trois petits points</b> en haut à droite de l'écran.</span></li>
                <li><span className="a-step-n">3</span><span className="a-step-t">Touchez <b>« Ajouter à l'écran d'accueil »</b> ou <b>« Installer l'application »</b>, puis confirmez.</span></li>
              </ol>
            )}
            <p className="a-modal-text" style={{ marginTop: 18, fontSize: 13.5, color: 'rgba(236,245,248,.6)' }}>
              Aucun téléchargement sur un store : c'est immédiat, gratuit, et l'icône restera sur votre
              écran d'accueil comme une vraie application.
            </p>
            <div className="a-modal-actions">
              <button className="a-foot-btn ghost" onClick={() => setShowInstall(false)}>J'ai compris</button>
            </div>
          </div>
        </div>
      )}

      {/* Carte-souvenir partageable */}
      {souvenir && (
        <div className="a-souvenir" onClick={closeSouvenir}>
          <div className="s-card" onClick={(e) => e.stopPropagation()}>
            <button className="s-x" onClick={closeSouvenir} aria-label="Fermer"><X size={18} /></button>
            <div className="s-brand">Fabien Olicard m'a appris que</div>
            <p className="s-kicker">{souvenirKicker(souvenir)}</p>

            <div className="s-list">
              {souvenir.items.map((it, i) => (
                <div className="s-item" key={i}>
                  {souvenir.type === 'year' && (
                    <>
                      <h3 className="s-name" style={{ fontSize: 18 }}>{it.t}</h3>
                      <p className="s-fact">{it.s}</p>
                    </>
                  )}
                  {souvenir.type === 'more' && (
                    <>
                      <span className="s-scope">{it.label}</span>
                      <h3 className="s-name" style={{ fontSize: 19 }}>{it.value}</h3>
                    </>
                  )}
                  {souvenir.type === 'age' && (
                    <>
                      <h3 className="s-name">{it.name}</h3>
                      {it.fact && <p className="s-fact">{cap(it.fact)}</p>}
                      {it.year && <span className="s-year">{it.year}</span>}
                    </>
                  )}
                  {souvenir.type === 'day' && (
                    <>
                      <h3 className="s-name">{it.name}</h3>
                      {it.blurb && <p className="s-fact">{cap(it.blurb.replace(/^\((.+)\)$/, '$1'))}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="s-actions">
              <button className="s-share" onClick={() => shareStory(souvenir)}><Share2 size={16} /> Partager</button>
              <button className="s-close" onClick={closeSouvenir}>Fermer</button>
            </div>
            <p className="s-hint">La photo arrivera dans votre pellicule. Publiez-la en story et taguez <b style={{ color: '#C3F2FB' }}>@fabienolicard</b> 🤍</p>
            <a className="s-insta" href={INSTA_URL} target="_blank" rel="noreferrer noopener">
              <Instagram size={14} /> Suivre Fabien sur Instagram
            </a>
          </div>
        </div>
      )}

      {toast && <div className="a-toast">{toast}</div>}
    </div>
  );
};

export default AlbertAgeApp;
