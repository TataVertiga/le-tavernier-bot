const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/welcomedUsers.json');

module.exports = async (oldMember, newMember) => {
  const roleId = '1208124766277318716'; // ID du rôle "gueux"
  const welcomeChannelId = '837135924390264855';

  const avaitPasLeRoleAvant = !oldMember.roles.cache.has(roleId);
  const aLeRoleMaintenant = newMember.roles.cache.has(roleId);

  if (avaitPasLeRoleAvant && aLeRoleMaintenant) {
    console.log(`🔄 Rôle "gueux" ajouté à ${newMember.user.tag} (${newMember.id})`);

    let welcomedUsers = [];
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        welcomedUsers = JSON.parse(data);
        console.log("📁 Fichier loaded avec succès :", welcomedUsers);
      } else {
        console.log("📁 Fichier welcomedUsers.json introuvable, il sera créé.");
      }
    } catch (err) {
      console.error('❌ Erreur lecture welcomedUsers.json :', err);
    }

    if (welcomedUsers.includes(newMember.id)) {
      console.log("⛔ Utilisateur déjà accueilli, on ignore.");
      return;
    }

    const channel = newMember.guild.channels.cache.get(welcomeChannelId);
    if (!channel) {
      console.error("❌ Salon de bienvenue introuvable !");
      return;
    }

    channel.send(`🍺 **Bienvenue à la taverne, ${newMember}!**  
Approche donc, pose ton fessier là où c’est encore tiède et présente-toi aux autres gueux. Le premier qui paie sa tournée est rarement le dernier à se faire des copains. Santé !`);

    welcomedUsers.push(newMember.id);
    fs.writeFile(filePath, JSON.stringify(welcomedUsers, null, 2), err => {
      if (err) {
        console.error('❌ Erreur écriture welcomedUsers.json :', err);
      } else {
        console.log("✅ Utilisateur ajouté dans welcomedUsers.json :", newMember.id);
      }
    });
  }
};
