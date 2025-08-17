const axios = require("axios");

module.exports = {
  name: "veo3",
  alias: ["veo"],
  desc: "Generate text using Veo3 AI",
  category: "AI",
  usage: "veo3 <your prompt>",
  react: "🤖",

  start: async (sock, m, { text, prefix, command }) => {
    try {
      if (!text) {
        return sock.sendMessage(m.chat, {
          text: `⚠️ Please provide a prompt!\n\nExample: *${prefix + command} write a poem about friendship*`
        }, { quoted: m });
      }

      // 🚀 Call Veo3 API
      const response = await axios.post("https://api.veo3.ai/generate", {
        prompt: text,
        key: process.env.VEO3_KEY   // ⚠️ apna API key .env file me daalna
      });

      const output = response.data.output || "❌ No response from Veo3 API";

      await sock.sendMessage(m.chat, { text: output }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.chat, {
        text: `❌ Veo3 Error: ${e.message}`
      }, { quoted: m });
    }
  }
};
