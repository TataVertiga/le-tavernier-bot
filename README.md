# 🍺 Le Tavernier - Bot Discord Médiéval

![Le Tavernier Logo](./assets/logo.png)

Bienvenue dans la taverne la plus beauf du royaume !  
**Le Tavernier** est un bot Discord conçu pour animer ta communauté avec un style médiéval, de l'humour franchouillard et une touche de folie RP.

---

## ⚙️ Fonctionnalités principales

- 🎉 Messages de bienvenue RP dans la taverne
- 🟢 Alertes automatiques de live **Kick**
- 🎬 Annonces TikTok et YouTube
- 📌 Attribution de rôles par réactions
- 📣 Faux système IA RP avec +500 répliques personnalisées
- 🤡 Commandes fun (`t!douzinite`, `t!prout`, `t!bonjour`, `t!help`...)

---

## 🚀 Lancer le bot en local

1. Clone ce repo :
   ```bash
   git clone https://github.com/TonCompte/le-tavernier-bot.git
   ```
2. Installe les dépendances :
   ```bash
   npm install
   ```
3. Configure ton fichier `.env` :
   ```env
   DISCORD_TOKEN=ton_token
   GUILD_ID=ton_id_serveur
   CHANNEL_ID=id_du_salon_alertes
   KICK_USERNAME=ton_nom_kick
   ```
4. Démarre le bot :
   ```bash
   npm start
   ```

> 💡 Tu peux aussi lancer uniquement le serveur web (nécessaire pour Render/UptimeRobot) :
> ```bash
> npm run web
> ```

---

## 🛠 Hébergement

Le bot est prévu pour tourner en continu via [Render.com](https://render.com) avec un `server.js` Express pour garder le service actif, couplé à [UptimeRobot](https://uptimerobot.com/) pour le ping régulier.

---

## 📂 Structure du projet

```
le-tavernier-bot/
├── commands/           # Commandes Discord (bonjour, douzinite, etc.)
├── events/             # Gestion des événements (arrivée, update)
├── services/           # Intégrations auto (Kick, TikTok...)
├── .env                # Variables d’environnement (non versionnées)
├── config.js           # Configuration du bot
├── index.js            # Point d’entrée principal du bot
├── server.js           # Serveur Express pour hébergement
└── package.json        # Dépendances et scripts
```

---

## 🤝 Contribuer

Tu veux proposer une nouvelle commande, ajouter des répliques beauf, ou intégrer un service ? Forke le projet, fais tes modifs, et propose une PR avec bonne humeur !

---

## 🧙‍♂️ À propos

Développé par la communauté de **Tata Vertiga** pour les gueux, les poivrots et les troubadours.  
Ce bot ne remplace pas la cervoise, mais il peut annoncer quand y en a une à boire.

---

## 🐾 Licence

ISC - Fais-en bon usage, ou subis le courroux du Tavernier.
