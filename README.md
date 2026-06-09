# 1H de mentalisme — Aetas (Fabien Olicard)

Web-app mobile (React + Vite). Fond aubergine, accents cyan, recherche par âge / année / date,
révélation animée, son, carte-souvenir partageable.

---

## 🚀 Mise en ligne en ~3 minutes — GitHub → Vercel

Tu n'as **rien à installer** sur ton ordi : Vercel se charge d'installer et de compiler.

1. **Crée un dépôt GitHub** (vide, privé ou public).
2. **Dépose ces fichiers** dans le dépôt (glisser-déposer dans l'interface web de GitHub
   fonctionne très bien). ⚠️ N'envoie PAS `node_modules` ni `dist` (ils sont ignorés).
3. Va sur **vercel.com → Add New → Project → Import** ton dépôt.
4. Vercel détecte **Vite** automatiquement (Build : `vite build`, Output : `dist`).
   Ne touche à rien → **Deploy**.
5. Quelques secondes plus tard, tu as une **URL `*.vercel.app`** en ligne. ✅

À chaque `git push`, Vercel redéploie tout seul.

### Alternative encore plus rapide (terminal, sans GitHub)
```bash
npm i -g vercel
cd aetas
vercel        # suis les questions, accepte les valeurs par défaut
vercel --prod # met en production
```

---

## 💻 Lancer en local (optionnel)
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # génère /dist
npm run preview  # prévisualise le build
```

---

## 🔜 Étape suivante : capture d'emails (Supabase)
La version actuelle n'utilise pas Supabase. Pour récupérer les emails du public après le
spectacle (via le QR code), on ajoutera un petit formulaire qui écrit dans une table Supabase
(clé publique `anon` + une table `leads`). À brancher quand tu veux.

## Pile technique
- React 18 + Vite 5
- lucide-react (icônes), tone (audio)
- 100 % web mobile, optimisé iOS Safari
