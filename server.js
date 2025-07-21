const express = require("express");
const server = express();

server.all("/", (req, res) => {
  res.send("Le Tavernier est en ligne !");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🟢 Serveur Keep-Alive en écoute sur le port ${PORT}`);
});