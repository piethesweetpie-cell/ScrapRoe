import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IFRAMELY_API_KEY = process.env.IFRAMELY_API_KEY;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is 비어 있습니다.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY 가 비어 있습니다.");
}
if (!IFRAMELY_API_KEY) {
  throw new Error("IFRAMELY_API_KEY 가 비어 있습니다.");
}

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

function pickThumbnail(data) {
  return (
    data?.links?.thumbnail?.[0]?.href ||
    data?.links?.image?.[0]?.href ||
    data?.meta?.thumbnail ||
    data?.meta?.image ||
    data?.meta?.og?.image ||
    null
  );
}

function pickTitle(data) {
  return (
    data?.meta?.title ||
    data?.meta?.og?.title ||
    data?.title ||
    "Untitled"
  );
}

async function fetchIframely(url) {
  const apiUrl =
    `https://iframe.ly/api/iframely?url=${encodeURIComponent(url)}&api_key=${encodeURIComponent(IFRAMELY_API_KEY)}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`Iframely 요청 실패: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    title: pickTitle(data),
    thumbnail: pickThumbnail(data),
    raw: data,
  };
}

async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) {
    throw new Error(`이미지 다운로드 실패: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function main() {
  console.log("썸네일 다운로드 시작...");

  const { data: rows, error } = await supabase
    .from("videos")
    .select("id, url, title, thumbnail_url")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!rows || rows.length === 0) {
    console.log("videos 테이블에 데이터가 없습니다.");
    return;
  }

  console.log(`총 ${rows.length}개 처리 시작`);

  for (const row of rows) {
    const id = row.id;
    const url = row.url;

    if (!url) {
      console.log(`[SKIP] ${id} url 없음`);
      continue;
    }

    try {
      console.log(`[FETCH] ${id} ${url}`);

      const meta = await fetchIframely(url);

      if (!meta.thumbnail) {
        console.log(`[SKIP] ${id} 썸네일 없음`);
        continue;
      }

      const fileBase = safeFileName(id || meta.title || "thumb");
      const fileName = `${fileBase}.jpg`;
      const destPath = path.join(IMAGE_DIR, fileName);
      const publicPath = `/images/${fileName}`;

      await downloadImage(meta.thumbnail, destPath);

      const { error: updateError } = await supabase
        .from("videos")
        .update({
          thumbnail_url: publicPath,
          title: row.title || meta.title,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      console.log(`[OK] ${id} -> ${publicPath}`);
    } catch (err) {
      console.error(`[FAIL] ${id}:`, err.message);
    }
  }

  console.log("완료");
}

main().catch((err) => {
  console.error("치명적 오류:", err);
  process.exit(1);
});
