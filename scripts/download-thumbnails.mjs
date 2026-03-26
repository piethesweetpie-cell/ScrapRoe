import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error("SUPABASE_URL 또는 VITE_SUPABASE_URL 이 비어 있습니다.");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY 가 비어 있습니다.");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const IMAGE_DIR = path.join(process.cwd(), "public", "images");
fs.mkdirSync(IMAGE_DIR, { recursive: true });

function safeFileName(input) {
  return String(input)
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function extractOgImage(html) {
  const raw =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ||
    html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i)?.[1] ||
    "";
  return decodeHtml(raw);
}

async function fetchThumbnailUrl(url) {
  // 1. 직접 파싱 (Instagram: facebookexternalhit UA)
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (res.ok) {
      const html = await res.text();
      const image = extractOgImage(html);
      if (image) return image;
    }
  } catch { /* fallthrough */ }

  // 2. Microlink fallback
  try {
    const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
    const mlJson = await mlRes.json();
    if (mlJson?.status === "success") {
      const image = mlJson.data?.image?.url || "";
      if (image) return image;
    }
  } catch { /* fallthrough */ }

  return null;
}

async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`이미지 다운로드 실패: ${res.status} ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

// thumbnail_url이 이미 로컬(/images/)이면 스킵
function needsUpdate(thumbnailUrl) {
  if (!thumbnailUrl) return true;
  if (thumbnailUrl.startsWith("/images/")) return false;
  return true;
}

async function main() {
  console.log("썸네일 다운로드 시작...");

  const { data: rows, error } = await supabase
    .from("videos")
    .select("id, url, title, thumbnail_url")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!rows || rows.length === 0) {
    console.log("videos 테이블에 데이터가 없습니다.");
    return;
  }

  const toProcess = rows.filter(r => needsUpdate(r.thumbnail_url));
  console.log(`총 ${rows.length}개 중 업데이트 필요: ${toProcess.length}개`);

  for (const row of toProcess) {
    const id = row.id;
    const url = row.url;

    if (!url) {
      console.log(`[SKIP] ${id} url 없음`);
      continue;
    }

    try {
      console.log(`[FETCH] ${id} ${url}`);

      const thumbnailUrl = await fetchThumbnailUrl(url);
      if (!thumbnailUrl) {
        console.log(`[SKIP] ${id} 썸네일 없음`);
        continue;
      }

      const fileBase = safeFileName(id || "thumb");
      const fileName = `${fileBase}.jpg`;
      const destPath = path.join(IMAGE_DIR, fileName);
      const publicPath = `/images/${fileName}`;

      await downloadImage(thumbnailUrl, destPath);

      const { error: updateError } = await supabase
        .from("videos")
        .update({ thumbnail_url: publicPath })
        .eq("id", id);

      if (updateError) throw updateError;

      console.log(`[OK] ${id} -> ${publicPath}`);
    } catch (err) {
      console.error(`[FAIL] ${id}:`, err.message);
    }
  }

  console.log("\n완료! 다음 명령으로 GitHub에 올리세요:");
  console.log("  git add public/images/");
  console.log("  git commit -m 'chore: 썸네일 이미지 업데이트'");
  console.log("  git push");
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
