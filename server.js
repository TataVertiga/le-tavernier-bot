const express = require("express");
const server = express();

server.all("/", (req, res) => {
  res.send("Le Tavernier est en ligne !");
});

server.listen(3000, () => {
  console.log("🟢 Serveur Keep-Alive en écoute sur le port 3000");
});