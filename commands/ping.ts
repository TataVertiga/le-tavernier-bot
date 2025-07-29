import { Message } from 'discord.js';

export default {
  name: 'ping',
  description: 'Répond pong',
  execute(message: Message) {
    message.reply('pong !');
  }
};
