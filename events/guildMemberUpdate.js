const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/welcomedUsers.json');
const recentWelcomes = new Set(); // Empêche les doublons immédiats

module.exports = async (oldMember, newMember) => {
  const roleId = '1208124766277318716'; // ID du rôle "gueux"
  const welcomeChannelId = '837135924390264855';
  const debugChannelId = '845582902674980894'; // À remplacer si besoin

  const avaitPasLeRoleAvant = !oldMember.roles.cache.has(roleId);
  const aLeRoleMaintenant = newMember.roles.cache.has(roleId);

  if (avaitPasLeRoleAvant && aLeRoleMaintenant) {
    console.log(`🔄 Rôle "gueux" détecté pour ${newMember.user.tag} (${newMember.id})`);
    console.log("📁 __dirname =", __dirname);

    if (recentWelcomes.has(newMember.id)) {
      console.log("⏳ Double détection ignorée");
      return;
    }
    recentWelcomes.add(newMember.id);
    setTimeout(() => recentWelcomes.delete(newMember.id), 3000);

    let welcomedUsers = [];
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        welcomedUsers = JSON.parse(data);
        console.log("📖 Utilisateurs déjà accueillis :", welcomedUsers);
      } else {
        console.log("📁 Fichier non trouvé, il sera créé :", filePath);
      }
    } catch (err) {
      console.error('❌ Erreur lecture welcomedUsers.json :', err);
    }

    if (welcomedUsers.includes(newMember.id)) {
      console.log("⛔ Déjà accueilli, on ne dit rien.");
      return;
    }

    const channel = newMember.guild.channels.cache.get(welcomeChannelId);
    const debugChannel = newMember.guild.channels.cache.get(debugChannelId);
    if (!channel) {
      console.error("❌ Salon de bienvenue introuvable !");
      return;
    }

    channel.send(`🍺 **Bienvenue à la taverne, ${newMember}!**  
Approche donc, pose ton fessier là où c’est encore tiède et présente-toi aux autres gueux. Le premier qui paie sa tournée est rarement le dernier à se faire des copains. Santé !`);

    welcomedUsers.push(newMember.id);
    try {
      fs.writeFileSync(filePath, JSON.stringify(welcomedUsers, null, 2), 'utf8');
      console.log("✅ Ajouté à welcomedUsers.json :", newMember.id);
      if (debugChannel) {
        debugChannel.send(`✅ Écriture réussie dans welcomedUsers.json pour <@${newMember.id}>`);
      }
    } catch (err) {
      console.error("❌ Erreur écriture du fichier welcomedUsers.json :", err);
      if (debugChannel) {
        debugChannel.send(`❌ Échec de l'écriture dans welcomedUsers.json pour <@${newMember.id}>`);
      }
    }
  }
};
