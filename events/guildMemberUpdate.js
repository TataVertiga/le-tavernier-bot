const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/welcomedUsers.json');

module.exports = async (oldMember, newMember) => {
  const roleId = '1208124766277318716'; // ID du rôle "gueux"
  const welcomeChannelId = '837135924390264855';

  const avaitPasLeRoleAvant = !oldMember.roles.cache.has(roleId);
  const aLeRoleMaintenant = newMember.roles.cache.has(roleId);

  if (avaitPasLeRoleAvant && aLeRoleMaintenant) {
    let welcomedUsers = [];
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        welcomedUsers = JSON.parse(data);
      } catch (err) {
        console.error('Erreur lecture welcomedUsers.json :', err);
      }
    }

    if (welcomedUsers.includes(newMember.id)) return;

    const channel = newMember.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    channel.send(`🍺 **Bienvenue à la taverne, ${newMember}!**  
Approche donc, pose ton fessier là où c’est encore tiède et présente-toi aux autres gueux. Le premier qui paie sa tournée est rarement le dernier à se faire des copains. Santé !`);

    welcomedUsers.push(newMember.id);
    fs.writeFile(filePath, JSON.stringify(welcomedUsers, null, 2), err => {
      if (err) console.error('Erreur écriture welcomedUsers.json :', err);
    });
  }
};
