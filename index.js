const { Client, GatewayIntentBits, Events, Partials } = require("discord.js");
require("dotenv").config();
require("./server");
const { PREFIX } = require("./config");
const fs = require("fs");
const path = require("path");

// Chargement dynamique des commandes
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, "./commands")).filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.name && typeof command.execute === "function") {
    commands.set(command.name, command);
    console.log(`Commande chargée : ${command.name}`);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

const { checkKickLive } = require("./services/kick");
const { checkTikTok } = require("./services/tiktok");
const reglementValidation = require("./services/reglementValidation");
console.log("✅ reglementValidation.js chargé et prêt !");

// Chargement dynamique des événements
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.name && typeof event.execute === "function") {
    client.on(event.name, (...args) => event.execute(...args));
    console.log(`🎉 Événement chargé : ${event.name}`);
  }
}

client.on(reglementValidation.name, (...args) => {
  console.log(`[DEBUG] Réaction détectée pour l'événement : ${reglementValidation.name}`);
  reglementValidation.execute(...args);
});
console.log("📜 Validation règlement branchée !");

client.once("ready", () => {

  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'data/welcomedUsers.json');
  const logChannel = client.channels.cache.get('845582902674980894');

  try {
    let welcomedUsers = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      welcomedUsers = JSON.parse(data);
    }

    if (!welcomedUsers.includes("test-write-id")) {
      welcomedUsers.push("test-write-id");
      fs.writeFileSync(filePath, JSON.stringify(welcomedUsers, null, 2), 'utf8');
      if (logChannel) logChannel.send("✅ Test d’écriture JSON réussi.");
    } else {
      if (logChannel) logChannel.send("ℹ️ ID test déjà présent dans welcomedUsers.json.");
    }
  } catch (err) {
    if (logChannel) logChannel.send("❌ Échec d’écriture dans welcomedUsers.json : " + err.message);
  }

  cleanup(client);

  console.log(`✅ Le Tavernier est connecté en tant que ${client.user.tag}`);
  setInterval(() => checkKickLive(client), 30000);
  setInterval(() => checkTikTok(client), 180000);
});

client.on(Events.GuildMemberAdd, member => onGuildMemberAdd(client, member));

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);
    if (command) {
      try {
        await command.execute(message, args);
      } catch (err) {
        console.error(`Erreur avec la commande ${commandName}:`, err);
        message.reply("🤕 Le Tavernier s’est pris les pieds dans le tapis...");
      }
    }
    return;
  }

  if (message.mentions.has(client.user)) {
    const now = Date.now();
    if (!client.lastPingTimes) client.lastPingTimes = {};
    const lastPing = client.lastPingTimes[message.author.id] || 0;
    const delay = now - lastPing;

    const baseReplies = [
      "De quoi ?",
      "Keskidi ?",
      "Hein ?",
      "Tu veux ma bière ou quoi ?",
      "Parle plus fort, j’ai le houblon bouché.",
      "Qu’est-ce que c’est encore que ces simagrées ?",
      "Vous criez, vous criez, mais vous dites rien !",
      "Une chope, deux baffes, choisis bien ta prochaine phrase.",
      "Mais vous êtes pas mort espèce de connard ?",
      "Ah non mais moi j’suis là pour servir, pas pour discuter.",
      "Non j’peux pas, j’ai pas l’temps, j’ai rien à faire.",
      "Vous avez frappé à la mauvaise taverne.",
      "J’écoute d’une oreille distraite et l’autre bourrée.",
      "Qui ose troubler ma sieste digestive ?"
    ];

    const sassyReplies = [
      "Non j’peux pas, j’ai pas l’temps, j’ai rien à faire.",
      "Parle-moi encore comme ça et j’te sers un râteau médiéval.",
      "Ton message sent la Douzinite aiguë.",
      "Tu veux une choppe ou une claque ?",
      "Mais vous êtes pas mort espèce de connard ?",
      "J'vous ai répondu déjà ! Z'avez bu ou quoi ?",
      "Vous me fatiguez, c’est pas croyable...",
      "C’est pas moi qui ai commencé !",
      "Tu veux du pain ? Y’a plus de pain.",
      "Ça commence à faire beaucoup d’interruptions pour un seul homme.",
      "Si c’est pas urgent, j’reviens dans 3 pintes.",
      "T’as une tête à finir au pilori toi...",
      "Je note ton nom et j’oublie aussitôt."
    ];

    const replyList = delay > 30000 ? baseReplies : sassyReplies;
    const random = replyList[Math.floor(Math.random() * replyList.length)];
    await message.reply(random);
    client.lastPingTimes[message.author.id] = now;
  }
});

client.login(process.env.DISCORD_TOKEN);


const cleanup = require('./cleanupWelcomedUsers');

client.once('ready', () => {
  console.log(`${client.user.tag} est prêt.`);
  cleanup(client); // Nettoyage des utilisateurs déjà accueillis
});

const logChannelId = '845582902674980894';

client.once("ready", async () => {
  try {
    const logChannel = await client.channels.fetch(logChannelId);
    if (logChannel) {
      await logChannel.send("📡 Le Tavernier est bien réveillé et connecté.");
    } else {
      console.log("❌ Salon de log introuvable après fetch.");
    }
  } catch (err) {
    console.error("❌ Erreur lors de la récupération du salon log :", err);
  }
});
