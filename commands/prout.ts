import { Message } from 'discord.js';

const gifs = [
  "https://tenor.com/bhqOH.gif",
  "https://tenor.com/bQ3SA.gif",
  "https://tenor.com/bgW3h.gif",
  "https://tenor.com/sMel4CpJV6H.gif",
  "https://tenor.com/4bAy.gif",
  "https://tenor.com/tzG3b5Mutyx.gif",
  "https://tenor.com/bFCAb.gif",
  "https://tenor.com/tzG3b5Mutyx.gif",
  "https://tenor.com/bf2GJ.gif",
  "https://tenor.com/bkd90.gif",
  "https://tenor.com/bnlUE.gif",
];

const cooldowns = new Map<string, number>();
const COOLDOWN = 10_000; // 10 secondes

export default {
  name: 'prout',
  description: 'Envoie un gif de prout au hasard',
  execute(message: Message) {
    const now = Date.now();
    const last = cooldowns.get(message.author.id) || 0;

    if (now - last < COOLDOWN) {
      message.reply("🥴 Doucement, une prout par tournée...");
      return;
    }

    cooldowns.set(message.author.id, now);
    const random = gifs[Math.floor(Math.random() * gifs.length)];
    (message.channel as any).send(random);
  }
};
