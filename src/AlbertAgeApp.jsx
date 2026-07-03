import React, { useState, useEffect, useRef } from 'react';
import { Search, Hourglass, CalendarRange, Cake, Share2, Volume2, VolumeX, X } from 'lucide-react';
import * as Tone from 'tone';

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

const AlbertAgeApp = () => {
  const [mode, setMode] = useState('age'); // 'age' | 'year' | 'birthday'
  const [age, setAge] = useState('');
  const [year, setYear] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [results, setResults] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [souvenir, setSouvenir] = useState(null);
  const [toast, setToast] = useState('');
  const canvasRef = useRef(null);
  const revealTimer = useRef(null);
  const pendingRef = useRef(null);
  const synthRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // BACK-OFFICE PRIVÉ — route /admin-fabien
  // ⚠️ Garde-fou léger : empêche un curieux d'entrer, mais le mot de
  // passe est lisible dans le code côté navigateur. Vraie sécurité = Supabase.
  // ─────────────────────────────────────────────────────────────
  const ADMIN_EMAIL = 'fabien.olicard@me.com';
  const ADMIN_PASS = 'ArThUr351PaRfAit';
  const [isAdminRoute] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.replace(/\/+$/, '').toLowerCase() === '/admin-fabien';
  });
  const [adminAuth, setAdminAuth] = useState(() => {
    try { return sessionStorage.getItem('fab_admin_ok') === '1'; } catch (e) { return false; }
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminErr, setAdminErr] = useState('');
  const submitAdminLogin = () => {
    const okEmail = adminEmail.trim().toLowerCase() === ADMIN_EMAIL;
    const okPass = adminPass === ADMIN_PASS;
    if (okEmail && okPass) {
      setAdminAuth(true);
      setAdminErr('');
      try { sessionStorage.setItem('fab_admin_ok', '1'); } catch (e) {}
    } else {
      setAdminErr('Email ou mot de passe incorrect.');
    }
  };
  const adminLogout = () => {
    setAdminAuth(false);
    setAdminEmail('');
    setAdminPass('');
    try { sessionStorage.removeItem('fab_admin_ok'); } catch (e) {}
  };

  // ─────────────────────────────────────────────────────────────
  // BASE DE DONNÉES — PAR ÂGE (15 → 76)
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
  // MODE 2 — ÉVÉNEMENTS PAR ANNÉE DE NAISSANCE  (échantillon, à enrichir)
  // Format : { année: [ { scope: "France" | "Monde", text: "…" }, … ] }
  // ─────────────────────────────────────────────────────────────
  const yearEvents = {
    1969: [
      { scope: "Monde", text: "Premiers pas de l'Homme sur la Lune lors de la mission Apollo 11." },
      { scope: "Monde", text: "Premier vol d'essai du Concorde." }
    ],
    1981: [
      { scope: "France", text: "Abolition de la peine de mort, portée par Robert Badinter." },
      { scope: "France", text: "Mise en service du premier TGV, sur la ligne Paris–Lyon." }
    ],
    1989: [
      { scope: "Monde", text: "Chute du mur de Berlin." },
      { scope: "France", text: "Inauguration de la pyramide du Louvre, année du bicentenaire de la Révolution." }
    ],
    1998: [
      { scope: "France", text: "La France remporte sa première Coupe du monde de football." },
      { scope: "Monde", text: "Fondation de l'entreprise Google." }
    ]
  };

  // ─────────────────────────────────────────────────────────────
  // MODE 3 — CÉLÉBRITÉS NÉES LE MÊME JOUR  (échantillon, à enrichir)
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
    ]
  };

  const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const pad = (n) => String(n).padStart(2, '0');

  // Calcule le résultat (ou null si vide, ou {type:'error'} si invalide)
  const computeResult = () => {
    if (mode === 'age') {
      if (age === '') return null;
      const n = parseInt(age);
      if (isNaN(n) || n < 15 || n > 76) return { type: 'error', msg: 'Veuillez entrer un âge entre 15 et 76 ans.' };
      return { type: 'age', items: database[n] || [], q: { age: n } };
    } else if (mode === 'year') {
      if (year === '') return null;
      const y = parseInt(year);
      if (isNaN(y) || y < 1900 || y > 2026) return { type: 'error', msg: 'Veuillez entrer une année entre 1900 et 2026.' };
      return { type: 'year', items: yearEvents[y] || [], q: { year: y } };
    } else {
      if (day === '' || month === '') return null;
      const d = parseInt(day), m = parseInt(month);
      if (isNaN(d) || d < 1 || d > 31 || isNaN(m) || m < 1 || m > 12) return { type: 'error', msg: 'Veuillez indiquer un jour (1–31) et un mois.' };
      return { type: 'birthday', items: birthdays[`${pad(m)}-${pad(d)}`] || [], q: { day: d, monthName: MONTHS[m - 1] } };
    }
  };

  // ─── Son (Tone.js) — désactivable, démarré au 1er geste utilisateur ───
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

  // ─── Recherche avec petite mise en scène (reveal court, tap pour passer) ───
  const handleSearch = () => {
    const r = computeResult();
    if (!r) { setResults(null); setRevealing(false); return; }
    if (r.type === 'error') { setResults(r); setRevealing(false); return; }
    if (revealTimer.current) clearTimeout(revealTimer.current);
    pendingRef.current = r;
    setResults(null);
    setSouvenir(null);
    setRevealing(true);
    playThinking();
    revealTimer.current = setTimeout(() => {
      setRevealing(false);
      setResults(pendingRef.current);
      playReveal();
    }, 750);
  };
  const finishReveal = () => {
    if (!revealing) return;
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setRevealing(false);
    setResults(pendingRef.current);
    playReveal();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const changeMode = (m) => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setMode(m);
    setResults(null); setRevealing(false); setSouvenir(null);
    setAge(''); setYear(''); setDay(''); setMonth('');
  };

  const reset = () => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    setResults(null); setRevealing(false); setSouvenir(null);
    setAge(''); setYear(''); setDay(''); setMonth('');
  };

  // ─── Carte-souvenir + partage ───
  const cap = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);
  const openSouvenir = () => {
    if (!results || !results.items || !results.items.length) return;
    setSouvenir({ type: results.type, items: results.items, q: results.q });
  };
  const closeSouvenir = () => setSouvenir(null);
  const souvenirKicker = (s) =>
    s.type === 'age' ? 'À mon âge…' : s.type === 'year' ? `En ${s.q.year}…` : `Né(e) un ${s.q.day} ${s.q.monthName}…`;
  const souvenirText = (s) => {
    const parts = s.items.map((it) => {
      if (s.type === 'age') return `${it.name} ${it.fact}`;
      if (s.type === 'year') return it.text;
      return it.blurb ? `${it.name} (${it.blurb})` : it.name;
    });
    return `Fabien Olicard m'a appris que — ${souvenirKicker(s).replace('…', '')} : ${parts.join(' · ')}`;
  };

  // Génère l'image 1080×1920 (format story) regroupant TOUS les résultats
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

    // Kicker (lisible : Sora gras, non italique)
    ctx.font = '700 56px Sora, sans-serif';
    ctx.fillStyle = '#C3F2FB';
    ctx.fillText(souvenirKicker(s), W / 2, 450);

    // Prépare les lignes de chaque résultat
    const maxW = W - 200;
    const titleFont = '700 46px Sora, sans-serif';
    const bodyFont = '400 34px Sora, sans-serif';
    const tagFont = '700 26px Sora, sans-serif';
    const noteFont = '600 28px Sora, sans-serif';

    const items = s.items.map((it) => {
      if (s.type === 'age') return { tag: '', title: it.name, body: cap(it.fact), note: it.year || '' };
      if (s.type === 'year') return { tag: it.scope, title: '', body: it.text, note: '' };
      return { tag: '', title: it.name, body: it.blurb ? cap(it.blurb) : '', note: '' };
    });

    const lineSets = items.map((it) => {
      const L = [];
      if (it.tag) L.push({ font: tagFont, text: it.tag.toUpperCase(), color: '#8FE6F5', lh: 48, ls: '4px' });
      if (it.title) { ctx.font = titleFont; for (const ln of wrapLines(ctx, it.title, maxW)) L.push({ font: titleFont, text: ln, color: '#FFFFFF', lh: 56, glow: true }); }
      if (it.body) { ctx.font = bodyFont; for (const ln of wrapLines(ctx, it.body, maxW)) L.push({ font: bodyFont, text: ln, color: 'rgba(236,245,248,0.86)', lh: 46 }); }
      if (it.note) L.push({ font: noteFont, text: it.note, color: '#C3F2FB', lh: 46 });
      return L;
    });

    const gap = 50;
    const heights = lineSets.map((L) => L.reduce((a, l) => a + l.lh, 0));
    const total = heights.reduce((a, h) => a + h, 0) + gap * Math.max(0, items.length - 1);
    const top = 560, bottom = 1740, avail = bottom - top;
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

    // Signature
    ctx.font = '700 28px Sora, sans-serif';
    ctx.fillStyle = 'rgba(236,245,248,0.5)';
    ctx.letterSpacing = '8px';
    ctx.fillText('FABIEN OLICARD', W / 2, 1838);
    ctx.letterSpacing = '0px';

    return await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png', 0.95));
  };

  // Partage : image (tous les résultats) → feuille de partage native, ou repli pellicule
  const shareStory = async (s) => {
    let blob = null;
    try { blob = await buildStoryImage(s); } catch { blob = null; }
    const file = blob ? new File([blob], 'olicard-souvenir.png', { type: 'image/png' }) : null;

    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: souvenirText(s) });
        return;
      } catch { /* annulé → repli */ }
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'olicard-souvenir.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setToast('Image enregistrée dans votre pellicule 📲');
      setTimeout(() => setToast(''), 2600);
      return;
    }
    try {
      await navigator.clipboard.writeText(souvenirText(s));
      setToast('Texte copié !'); setTimeout(() => setToast(''), 1800);
    } catch { /* rien */ }
  };

  // Nettoyage du timer au démontage
  useEffect(() => () => { if (revealTimer.current) clearTimeout(revealTimer.current); }, []);

  // ─────────────────────────────────────────────────────────────
  // Fond "constellation" animé (nœuds cyan reliés) — motif de l'affiche
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
  `;

  // ===== Rendu BACK-OFFICE (route privée /admin-fabien) =====
  if (isAdminRoute) {
    return (
      <div className="albert-root">
        <style>{css}</style>
        <canvas ref={canvasRef} className="albert-canvas" />
        <div className="albert-vignette" />
        <div className="albert-wrap">
          {!adminAuth ? (
            <div className="adm-card">
              <div className="adm-badge">Espace privé</div>
              <h1 className="adm-title">Back-office</h1>
              <p className="adm-sub">Accès réservé à Fabien</p>
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
              <button className="a-btn adm-btn" onClick={submitAdminLogin}>Se connecter</button>
              <a className="adm-back" href="/">← Retour au spectacle</a>
            </div>
          ) : (
            <div className="adm-shell">
              <div className="adm-topbar">
                <div>
                  <div className="adm-badge">Connecté</div>
                  <h1 className="adm-title" style={{ margin: '10px 0 0' }}>Back-office Fabien</h1>
                </div>
                <button className="adm-logout" onClick={adminLogout}>Déconnexion</button>
              </div>
              <div className="adm-placeholder">
                <p className="adm-ph-title">Prêt pour tes options 🎛️</p>
                <p className="adm-ph-text">
                  L'accès privé fonctionne. Donne-moi les fonctionnalités que tu veux ici
                  et je les ajoute dans cet espace.
                </p>
                <div className="adm-meta">Base actuelle : 526 entrées « par date » · 205 entrées « par âge »</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="albert-root">
      <style>{css}</style>
      <canvas ref={canvasRef} className="albert-canvas" />
      <div className="albert-vignette" />

      <button className="a-sound" onClick={() => setSoundOn((v) => !v)} aria-label={soundOn ? 'Couper le son' : 'Activer le son'}>
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      <div className="albert-wrap">
        <div className="a-hero">
          <h1>
            1H DE MENTALISME
            <span className="a-node" style={{ left: '3%',  top: '14%', animationDelay: '0s' }} />
            <span className="a-node" style={{ left: '50%', top: '-9%', animationDelay: '1.2s' }} />
            <span className="a-node" style={{ left: '97%', top: '22%', animationDelay: '.6s' }} />
            <span className="a-node" style={{ left: '7%',  top: '86%', animationDelay: '.9s' }} />
            <span className="a-node" style={{ left: '94%', top: '82%', animationDelay: '1.6s' }} />
          </h1>
        </div>

        <p className="a-tagline">
          avec Fabien Olicard
        </p>

        {/* Sélecteur de mode */}
        <div className="a-tabs">
          <button className={`a-tab ${mode === 'age' ? 'active' : ''}`} onClick={() => changeMode('age')}>
            <Hourglass size={15} strokeWidth={2.2} /> Par âge
          </button>
          <button className={`a-tab ${mode === 'year' ? 'active' : ''}`} onClick={() => changeMode('year')}>
            <CalendarRange size={15} strokeWidth={2.2} /> Par année
          </button>
          <button className={`a-tab ${mode === 'birthday' ? 'active' : ''}`} onClick={() => changeMode('birthday')}>
            <Cake size={15} strokeWidth={2.2} /> Par date
          </button>
        </div>

        {/* Panneau de saisie (adapté au mode) */}
        <div className="a-panel">
          {mode === 'age' && (
            <>
              <label className="a-label" htmlFor="age">Quel est votre âge ?</label>
              <div className="a-row">
                <div className="a-input-wrap">
                  <input id="age" className="a-input" type="number" min="15" max="76" value={age}
                    onChange={(e) => setAge(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Ex : 25" inputMode="numeric" />
                </div>
                <button className="a-btn" onClick={handleSearch}><Search size={18} strokeWidth={2.4} /> Révéler</button>
              </div>
            </>
          )}

          {mode === 'year' && (
            <>
              <label className="a-label" htmlFor="year">En quelle année êtes-vous né(e) ?</label>
              <div className="a-row">
                <div className="a-input-wrap">
                  <input id="year" className="a-input" type="number" min="1900" max="2026" value={year}
                    onChange={(e) => setYear(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Ex : 1985" inputMode="numeric" />
                </div>
                <button className="a-btn" onClick={handleSearch}><Search size={18} strokeWidth={2.4} /> Révéler</button>
              </div>
            </>
          )}

          {mode === 'birthday' && (
            <>
              <label className="a-label">Quel jour et quel mois êtes-vous né(e) ?</label>
              <div className="a-row">
                <div className="a-subrow">
                  <input className="a-input" type="number" min="1" max="31" value={day}
                    onChange={(e) => setDay(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Jour" inputMode="numeric" style={{ maxWidth: '110px' }} />
                  <select className="a-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                    <option value="">Mois</option>
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <button className="a-btn" onClick={handleSearch}><Search size={18} strokeWidth={2.4} /> Révéler</button>
              </div>
            </>
          )}
        </div>

        {/* Note d'accueil — visible tant qu'aucune recherche n'est lancée */}
        {!revealing && !results && (
          <p className="a-note">
            <span className="star">✦</span> Ceci est une première version. L'application s'enrichira
            au fil des prochains mois pour dévoiler, d'ici la fin de l'année, sa <b>forme définitive… pleine de surprises</b>.
          </p>
        )}

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
        {results && results.type !== 'error' && results.items.length > 0 && (
          <>
            <p className="a-rhead">
              {results.type === 'age' && `À votre âge…`}
              {results.type === 'year' && `En ${results.q.year}…`}
              {results.type === 'birthday' && `Le ${results.q.day} ${results.q.monthName}…`}
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
                      <span className="a-scope">{it.scope}</span>
                      <p className="a-card-fact">{it.text}</p>
                    </>
                  )}
                  {results.type === 'birthday' && (
                    <>
                      <h3 className="a-card-name"><span className="a-dot" />{it.name}</h3>
                      <p className="a-card-fact"><span className="hl">{it.name}</span>{it.blurb ? <>, {it.blurb}</> : null}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="a-share-all">
              <button onClick={openSouvenir}><Share2 size={17} /> Partager</button>
            </div>
            <div className="a-newage">
              <button onClick={reset}>✦ Nouvelle recherche</button>
            </div>
          </>
        )}

        {/* Saisie valide mais base encore vide */}
        {results && results.type !== 'error' && results.items.length === 0 && (
          <div className="a-state">
            <span className="ic">✦</span>
            Pas encore de données pour cette recherche ! Cette fonctionnalité sera complétée prochainement par Fabien.
          </div>
        )}

        {/* Erreur de saisie */}
        {results && results.type === 'error' && (
          <div className="a-state err">
            <span className="ic">⚠</span>
            {results.msg}
          </div>
        )}
      </div>

      {/* Carte-souvenir partageable (regroupe tous les résultats) */}
      {souvenir && (
        <div className="a-souvenir" onClick={closeSouvenir}>
          <div className="s-card" onClick={(e) => e.stopPropagation()}>
            <button className="s-x" onClick={closeSouvenir} aria-label="Fermer"><X size={18} /></button>
            <div className="s-brand">Fabien Olicard m'a appris que</div>
            <p className="s-kicker">{souvenirKicker(souvenir)}</p>

            <div className="s-list">
              {souvenir.items.map((it, i) => (
                <div className="s-item" key={i}>
                  {souvenir.type === 'year' ? (
                    <>
                      <span className="s-scope">{it.scope}</span>
                      <p className="s-fact">{it.text}</p>
                    </>
                  ) : (
                    <>
                      <h3 className="s-name">{it.name}</h3>
                      {(souvenir.type === 'age' ? it.fact : it.blurb) && <p className="s-fact">{cap(souvenir.type === 'age' ? it.fact : it.blurb)}</p>}
                      {souvenir.type === 'age' && it.year && <span className="s-year">{it.year}</span>}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="s-actions">
              <button className="s-share" onClick={() => shareStory(souvenir)}><Share2 size={16} /> Partager</button>
              <button className="s-close" onClick={closeSouvenir}>Fermer</button>
            </div>
            <p className="s-hint">La photo sera dans votre pellicule</p>
          </div>
        </div>
      )}

      {toast && <div className="a-toast">{toast}</div>}
    </div>
  );
};

export default AlbertAgeApp;
