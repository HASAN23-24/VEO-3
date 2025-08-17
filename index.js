import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import * as qrcode from "qrcode-terminal";
import { veo3 } from "./lib/veo3.js";

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const sock = makeWASocket({ printQRInTerminal: true, auth: state });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || "";

    if (text.startsWith(".veo3")) {
      const prompt = text.replace(".veo3", "").trim() || "demo video";
      const res = await veo3(prompt);
      if (!res.ok) return sock.sendMessage(from, { text: res.msg });
      const vid = await fs.readFile(res.path);
      await sock.sendMessage(from, {
        video: vid,
        caption: `🎥 Veo3 result (${res.note})`
      });
    }
  });
}

start();
