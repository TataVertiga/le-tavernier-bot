const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'welcomedUsers.json');

module.exports = async (client) => {
  const GUILD_ID = '837135924390264852'; // ID du serveur
  const guild = await client.guilds.fetch(GUILD_ID);
  const members = await guild.members.fetch();

  let welcomedUsers = [];
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      welcomedUsers = JSON.parse(data);
    } catch (err) {
      console.error('Erreur lecture welcomedUsers.json :', err);
      return;
    }
  }

  // Filtrer ceux qui sont encore dans le serveur
  const updatedList = welcomedUsers.filter(userId => members.has(userId));

  // Écriture du fichier mis à jour
  fs.writeFile(filePath, JSON.stringify(updatedList, null, 2), err => {
    if (err) console.error('Erreur écriture welcomedUsers.json :', err);
    else console.log('✅ Liste nettoyée. Utilisateurs toujours présents conservés.');
  });
};
