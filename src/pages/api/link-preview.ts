import type { NextApiRequest, NextApiResponse } from "next";

function isValidUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (error) { // ✅ 에러 해결: catch문에 변수(error) 명시
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ 에러 해결: req.query가 배열일 경우를 대비한 안전한 타입 체크
  const queryUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const url = (queryUrl || "").trim();
  
  const queryScreenshot = Array.isArray(req.query.screenshot) ? req.query.screenshot[0] : req.query.screenshot;
  const screenshot = (queryScreenshot || "0") === "1";

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ ok: false, error: "Invalid url" });
  }

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const mqlUrl = new URL("https://api.microlink.io/");
  mqlUrl.searchParams.set("url", url);
  mqlUrl.searchParams.set("ttl", "1h");
  mqlUrl.searchParams.set("staleTtl", "0"); 

  if (screenshot) {
    mqlUrl.searchParams.set("screenshot", "true");
  }

  try {
    const r = await fetch(mqlUrl.toString());
    if (!r.ok) {
      let errorText = "";
      try {
        errorText = await r.text();
      } catch (textErr) {
        errorText = "";
      }
      
      return res.status(r.status).json({
        ok: false,
        error: `Microlink error ${r.status}`,
        detail: errorText.slice(0, 200),
      });
    }

    const json = await r.json();
    const data = json?.data || {};
    const out = {
      ok: true,
      title: data.title || "",
      image: data.image?.url || data.image || "",
      screenshot: data.screenshot?.url || data.screenshot || "",
      statusCode: data.statusCode ?? json?.statusCode,
    };

    return res.status(200).json(out);
  } catch (e) {
    // ✅ 에러 해결: catch (e: any) 대신 안전한 타입 단언 사용
    const err = e as Error;
    return res.status(500).json({ ok: false, error: "Server fetch failed", detail: err?.message });
  }
}