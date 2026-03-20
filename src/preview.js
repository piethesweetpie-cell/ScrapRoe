function isValidUrl(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const url = String(req.query.url || "").trim();
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ ok: false, error: "Invalid url" });
  }

  // 캐시(같은 URL이면 서버가 재호출 덜 하게)
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const cleanUrl = url.split("?")[0].replace(/\/$/, "");

  // 1) JSONLink (키 있으면 우선)
  const JSONLINK_KEY = process.env.JSONLINK_API_KEY || "";
  if (JSONLINK_KEY) {
    try {
      const r1 = await fetch(
        `https://jsonlink.io/api/extract?api_key=${encodeURIComponent(JSONLINK_KEY)}&url=${encodeURIComponent(cleanUrl)}`
      );
      if (r1.ok) {
        const d1 = await r1.json();
        const title = d1?.title || "Instagram Video";
        const image = Array.isArray(d1?.images) && d1.images.length ? d1.images[0] : "";
        return res.status(200).json({ ok: true, title, image, source: "jsonlink" });
      }
    } catch {}
  }

  // 2) Dub (키 필요할 가능성 높음 + CORS 회피 위해 서버에서만 호출)
  const DUB_KEY = process.env.DUB_API_KEY || "";
  if (DUB_KEY) {
    try {
      const r2 = await fetch(
        `https://api.dub.co/metatags?url=${encodeURIComponent(cleanUrl)}`,
        { headers: { Authorization: `Bearer ${DUB_KEY}` } }
      );
      if (r2.ok) {
        const d2 = await r2.json();
        const title = d2?.title || "Instagram Video";
        const image = d2?.image || "";
        return res.status(200).json({ ok: true, title, image, source: "dub" });
      }
    } catch {}
  } else {
    // Dub 키가 없으면 굳이 시도하지 않음
  }

  return res.status(200).json({ ok: false, title: "Instagram Video", image: "" });
}