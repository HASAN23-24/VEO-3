const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { PREFIX, BOT_NAME } = require("./src/config");
const parse = require("./src/utils/parse");

// Load commands
const commands = {};
function loadCommands() {
  const dir = path.join(__dirname, "src", "commands");
  fs.readdirSync(dir).forEach(f => {
    if (!f.endsWith(".js")) return;
    const mod = require(path.join(dir, f));
    commands[mod.name] = mod;
    (mod.alias || []).forEach(a => { commands[a] = mod; });
  });
}
loadCommands();

async function startBot() {
  const sessionDir = process.env.SESSION_DIR || "./session";
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: [BOT_NAME || "VEO3", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (u) => {
    const { connection, qr, lastDisconnect } = u;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "open") console.log("✅ Connected.");
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log("❌ Connection closed.", reason, "Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg || !msg.message || msg.key.fromMe) return;

    const { from, text } = parse(msg);
    if (!text || !text.startsWith(PREFIX)) return;

    const [cmdName, ...rest] = text.slice(PREFIX.length).trim().split(/\s+/);
    const argText = rest.join(" ");
    const cmd = commands[cmdName?.toLowerCase()];

    try {
      if (!cmd) return sock.sendMessage(from, { text: `Unknown command. Try ${PREFIX}ping or ${PREFIX}veo3` });
      await cmd.start(sock, msg, { text: argText, prefix: PREFIX, command: cmdName });
    } catch (e) {
      await sock.sendMessage(from, { text: "❌ Error: " + (e?.message || e) });
    }
  });
}

startBot();
