<p align="center">
  <img src="./assets/le-tavernier.png" alt="Le Tavernier Logo" width="200"/>
</p>

<h1 align="center">🍺 Le Tavernier - Bot Discord Médiéval</h1>

<p align="center">
  Bienvenue dans la taverne la plus beauf du royaume !<br>
  <strong>Le Tavernier</strong> est un bot Discord conçu pour animer ta communauté avec un style médiéval, de l'humour franchouillard et une touche de folie RP.
</p>

---

## ⚙️ Fonctionnalités actuelles

- 🎉 Messages de bienvenue RP dans un salon spécifique
- 🟢 Annonce automatique des lives **Kick.com** via API officielle
- 🐦 Tweet automatique à chaque lancement de live
- 🤡 Commandes fun disponibles :
  - `!bonjour`
  - `!douzinite`
  - `!prout`
  - `!help`

---

## 🔄 Fonctionnalités prévues (en cours de dev)

- 🎬 Annonces TikTok & YouTube automatisées
- 📌 Attribution de rôles via réactions
- 🧠 Faux système IA RP avec +500 répliques aléatoires
- 🧣 Interface web pour ajouter des commandes sans coder
- 🎁 Giveaways automatiques dans le style taverne

---

## 🚀 Lancer le bot en local

1. Clone ce repo :
   ```bash
   git clone https://github.com/TataVertiga/le-tavernier-bot.git
   cd le-tavernier-bot
   ```

2. Installe les dépendances :
   ```bash
   npm install
   ```

3. Configure le fichier `.env` :
   ```env
   DISCORD_TOKEN=...
   CHANNEL_ID=...
   KICK_USERNAME=...
   KICK_CLIENT_ID=...
   KICK_CLIENT_SECRET=...
   TWITTER_ENABLED=true
   TWITTER_API_KEY=...
   TWITTER_API_SECRET=...
   TWITTER_ACCESS_TOKEN=...
   TWITTER_ACCESS_SECRET=...
   PORT=10000
   ```

4. Démarre le bot :
   ```bash
   npm start
   ```

> 💡 Tu peux aussi démarrer uniquement le serveur web (utilisé pour Render) :
> ```bash
> npm run web
> ```

---

## 🛠 Hébergement

Le bot fonctionne 24h/24 grâce à :

- [Render.com](https://render.com) pour héberger le projet Node.js
- [UptimeRobot](https://uptimerobot.com) pour maintenir le serveur actif

---

## 📂 Structure du projet

```
le-tavernier-bot/
├── commands/           # Commandes Discord (bonjour, douzinite, etc.)
├── events/             # Gestion des événements (arrivées, rôles)
├── services/           # Intégrations auto (Kick, Twitter, etc.)
├── data/               # Fichiers temporaires (statuts, IDs)
├── .env                # Variables d’environnement (non versionné)
├── config.js           # Préfixe & config du bot
├── index.js            # Démarrage du bot
├── server.js           # Serveur Express keep-alive
└── package.json        # Dépendances et scripts
```

---

## 🤝 Contribuer

Tu veux proposer une nouvelle commande, des répliques beauf ou une amélioration ?  
Fais un fork du projet, propose une PR, et le Tavernier lèvera sa chope en ton honneur.

---

## 🧙‍♂️ À propos

Développé par **Tata Vertiga** pour les poivrots, les trolls, les streamers et les gueux.  
Le Tavernier ne boit pas vos tokens, mais il peut annoncer quand y a de la cervoise.

---

## 🐾 Licence

ISC — Bois ça avec sagesse, ou subis le courroux du Tavernier.
