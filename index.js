require("dotenv").config()
const fs = require("fs")
const { default: makeWASocket } = require("@adiwajshing/baileys")

// Load commands
const commands = {}
fs.readdirSync("./commands").forEach(file => {
  const cmd = require(`./commands/${file}`)
  commands[cmd.name] = cmd
  if (cmd.alias) cmd.alias.forEach(a => commands[a] = cmd)
})

async function startBot() {
  const sock = makeWASocket({ printQRInTerminal: true })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m.message || !m.key.remoteJid) return
    const from = m.key.remoteJid
    const body = m.message.conversation || m.message.extendedTextMessage?.text || ""
    const prefix = process.env.PREFIX || "."
    const isCmd = body.startsWith(prefix)

    if (isCmd) {
      const [cmd, ...args] = body.slice(prefix.length).trim().split(" ")
      const text = args.join(" ")
      const command = commands[cmd]
      if (command) {
        command.start(sock, m, { text, prefix, command: cmd })
      }
    }
  })
}

startBot()
