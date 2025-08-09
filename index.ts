// --- Imports ---
import express from 'express';
import { Client, GatewayIntentBits, Partials, Events, Message } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { PREFIX } from './config.js';
import { initKick } from './services/kick.js';
import { checkYoutube } from './services/youtube.js';
import { initAnniversaires } from "./services/anniversaires.js";
import { resumeGiveaways } from "./services/giveawayManager.js";
import registerGiveawayInteraction from "./events/interactionCreate.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Serveur Express pour Render ---
const app = express();
app.get('/', (_, res) => res.send('🍺 Le Tavernier est en ligne !'));
app.listen(process.env.PORT || 10000, () =>
  console.log(`🚀 Serveur Express actif`)
);

// --- Client Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,                 // base
    GatewayIntentBits.GuildMembers,           // nécessaire pour GuildMemberUpdate + rôles
    GatewayIntentBits.GuildMessages,          // lire/écrire dans les salons
    GatewayIntentBits.MessageContent,         // si tu lis le contenu des messages
    GatewayIntentBits.GuildMessageReactions   // nécessaire pour MessageReactionAdd
  ],
  partials: [
    Partials.Message,   // fetch messages non mis en cache
    Partials.Channel,   // requis avec Partials.Message
    Partials.Reaction   // fetch des réactions non en cache
  ]
}) as Client & { lastPingTimes?: Record<string, number> };

// --- Enregistrement des interactions de giveaway ---
registerGiveawayInteraction(client);

// --- Chargement dynamique des commandes ---
async function loadCommands() {
  const commands = new Map<string, any>();
  const commandsPath = path.join(__dirname, 'commands');
  if (!fs.existsSync(commandsPath)) return commands;

  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  await Promise.all(commandFiles.map(async file => {
    const command = await import(`./commands/${file}`);
    if (command.default?.name && typeof command.default.execute === 'function') {
      commands.set(command.default.name, command.default);
      console.log(`📦 Commande chargée : ${command.default.name}`);
    }
  }));

  return commands;
}

// --- Chargement dynamique des événements ---
async function loadEvents(client: Client) {
  const eventsPath = path.join(__dirname, 'events');
  if (!fs.existsSync(eventsPath)) return;

  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  await Promise.all(eventFiles.map(async file => {
    const event = await import(`./events/${file}`);
    if (event.default?.name && typeof event.default.execute === 'function') {
      client.on(event.default.name, (...args: any[]) => event.default.execute(...args));
      console.log(`🎉 Événement chargé : ${event.default.name}`);
    }
  }));
}

// --- Initialisation ---
client.once('ready', async () => {
  console.log(`✅ Le Tavernier est connecté en tant que ${client.user?.tag}`);

  // ✅ Reprise automatique des giveaways après redémarrage
  resumeGiveaways(client);

  // ⏳ Lancer les autres services
  setTimeout(() => {
    initKick(client);
    initAnniversaires(client);
    checkYoutube(client);
    setInterval(() => checkYoutube(client), 10 * 60 * 1000);
  }, 3000);
});

// --- Gestion des messages & commandes ---
let commands: Map<string, any>;
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  // --- Commandes ---
  if (message.content.startsWith(PREFIX)) {
    if (!commands) return; // sécurité au boot
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = commands.get(commandName);
    if (command) {
      try {
        await command.execute(message, args);
      } catch (err) {
        console.error(`Erreur avec la commande ${commandName}:`, err);
        message.reply("🤕 Le Tavernier s’est pris les pieds dans le tapis...");
      }
    }
  }

  // --- Réponse au ping ---
  if (client.user && message.mentions.has(client.user)) {
    const now = Date.now();
    if (!client.lastPingTimes) client.lastPingTimes = {};
    const lastPing = client.lastPingTimes[message.author.id] || 0;
    const delay = now - lastPing;

    const baseReplies = [
      "De quoi ?", "Keskidi ?", "Hein ?", "Tu veux ma bière ou quoi ?",
      "Parle plus fort, j’ai le houblon bouché.", "Qu’est-ce que c’est encore que ces simagrées ?",
      "Vous criez, vous criez, mais vous dites rien !", "Une chope, deux baffes, choisis bien ta prochaine phrase.",
      "Mais vous êtes pas mort espèce de connard ?", "Ah non mais moi j’suis là pour servir, pas pour discuter.",
      "Non j’peux pas, j’ai pas l’temps, j’ai rien à faire.", "Vous avez frappé à la mauvaise taverne.",
      "J’écoute d’une oreille distraite et l’autre bourrée.", "Qui ose troubler ma sieste digestive ?"
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

    const replyList = delay > 30_000 ? baseReplies : sassyReplies;
    const random = replyList[Math.floor(Math.random() * replyList.length)];
    await message.reply(random);
    client.lastPingTimes[message.author.id] = now;
  }
});

// --- Lancement ---
(async () => {
  const token = process.env.DISCORD_TOKEN || process.env.TOKEN; // ← Option B
  if (!token) {
    console.error("❌ TOKEN manquant (mets DISCORD_TOKEN=... dans .env)");
    process.exit(1);
  }
  commands = await loadCommands();
  await loadEvents(client);
  await client.login(token);
})();
export default client;
