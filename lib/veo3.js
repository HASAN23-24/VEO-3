import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import crypto from "crypto";
import "dotenv/config";

const tmpFile = (ext) =>
  path.join(process.cwd(), `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`);

async function downloadFile(url, outPath) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download failed: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return outPath;
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args, { stdio: "ignore" });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg failed"))));
  });
}

async function fallbackVideo(prompt) {
  const outPath = tmpFile("mp4");
  await runFFmpeg([
    "-y",
    "-f", "lavfi",
    "-i", "color=c=black:s=1280x720:d=4",
    "-vf",
    `drawtext=text='${prompt.replace(/[:]/g," ")}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2`,
    "-pix_fmt", "yuv420p",
    outPath
  ]);
  return outPath;
}

export async function veo3(prompt) {
  if (process.env.ENABLE_VIDEO_GEN !== "true") {
    return { ok: false, msg: "🎬 Veo3 disabled. Set ENABLE_VIDEO_GEN=true" };
  }

  try {
    if (process.env.VEO3_HTTP_URL) {
      const headers = { "Content-Type": "application/json" };
      if (process.env.VEO3_HTTP_BEARER) {
        headers.Authorization = `Bearer ${process.env.VEO3_HTTP_BEARER}`;
      }
      const r = await fetch(process.env.VEO3_HTTP_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt })
      });
      const data = await r.json();
      const dl = data.download_url || data.url;
      if (dl) {
        const out = tmpFile("mp4");
        await downloadFile(dl, out);
        return { ok: true, path: out, note: "provider" };
      }
    }
  } catch (e) {
    // ignore → fallback
  }

  const fb = await fallbackVideo(prompt);
  return { ok: true, path: fb, note: "fallback" };
}
