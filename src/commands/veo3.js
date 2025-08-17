const axios = require("axios");

module.exports = {
  name: "veo3",
  alias: ["veo"],
  desc: "Generate using VEO3 provider",
  category: "AI",
  usage: "veo3 <your prompt>",
  react: "🤖",

  start: async (sock, m, { text, prefix, command }) => {
    const chat = m.key.remoteJid;

    if (!text) {
      return sock.sendMessage(chat, {
        text: `⚠️ Prompt required.\nExample: *${prefix + command} write a 2-line motivational quote*`
      }, { quoted: m });
    }

    const url = (process.env.VEO3_HTTP_URL || "").trim();
    const bearer = (process.env.VEO3_HTTP_BEARER || "").trim();

    // If no provider configured, reply helpful fallback
    if (!url) {
      return sock.sendMessage(chat, {
        text: `ℹ️ VEO3 provider not configured.\nYour prompt: _${text}_\n\nAdd *VEO3_HTTP_URL* (and optional *VEO3_HTTP_BEARER*) in .env to enable real generation.`
      }, { quoted: m });
    }

    try {
      const headers = { "Content-Type": "application/json" };
      if (bearer) headers.Authorization = `Bearer ${bearer}`;

      // Generic schema: POST {prompt} -> {output} or {download_url}
      const res = await axios.post(url, { prompt: text }, { headers, timeout: 120000 });

      const data = res.data || {};
      const output = data.output || data.result || null;
      const downloadUrl = data.download_url || data.url || (data.result && data.result.url) || null;

      if (downloadUrl) {
        // If provider returns direct file URL, send the URL (or download+send if you prefer)
        return sock.sendMessage(chat, { text: `🎥 Generated video:\n${downloadUrl}` }, { quoted: m });
      }
      if (typeof output === "string") {
        return sock.sendMessage(chat, { text: output }, { quoted: m });
      }
      return sock.sendMessage(chat, { text: "❌ Provider returned no usable output." }, { quoted: m });

    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Unknown error";
      return sock.sendMessage(chat, { text: `❌ VEO3 error: ${msg}` }, { quoted: m });
    }
  }
};
