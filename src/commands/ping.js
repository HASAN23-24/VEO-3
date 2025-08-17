module.exports = {
  name: "ping",
  alias: [],
  desc: "Health check",
  category: "Core",
  usage: "ping",
  react: "🏓",
  start: async (sock, m) => {
    await sock.sendMessage(m.key.remoteJid, { text: "pong ✅" }, { quoted: m });
  }
};
