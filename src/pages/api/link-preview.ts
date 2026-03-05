import type { NextApiRequest, NextApiResponse } from "next";

function isValidUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = String(req.query.url || "").trim();
  const screenshot = String(req.query.screenshot || "0") === "1";

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ ok: false, error: "Invalid url" });
  }

  // ✅ CDN 캐시: 같은 URL은 1시간 동안 서버에서 재호출 거의 안 함
  // (stale-while-revalidate로 체감은 더 좋아짐)
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  // ✅ Microlink 호출: cache는 기본적으로 레이어가 있고 ttl도 설정 가능 :contentReference[oaicite:2]{index=2}
  const mqlUrl = new URL("https://api.microlink.io/");
  mqlUrl.searchParams.set("url", url);
  mqlUrl.searchParams.set("ttl", "1h");
  mqlUrl.searchParams.set("staleTtl", "0"); // 만료 시 백그라운드 재검증 패턴 :contentReference[oaicite:3]{index=3}

  // ✅ “스크린샷 자동 생성”은 필요할 때만(버튼 클릭/저장 시 1회) 켜세요.
  // Microlink screenshot 파라미터 공식 :contentReference[oaicite:4]{index=4}
  if (screenshot) {
    // 전체 페이지까지 원하면 fullPage true :contentReference[oaicite:5]{index=5}
    mqlUrl.searchParams.set("screenshot", "true");
    // fullPage는 query string으로는 문서 예시가 객체 형태라,
    // 가장 안전하게는 기본 스크린샷만 쓰고 필요하면 서버 SDK로 확장 권장
    // (일단 “썸네일 대용 스크린샷”이면 기본 캡처로도 충분)
  }

  try {
    const r = await fetch(mqlUrl.toString());
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      // 429면 프론트에서 “잠시 후 재시도”로 처리
      return res.status(r.status).json({
        ok: false,
        error: `Microlink error ${r.status}`,
        detail: text.slice(0, 200),
      });
    }

    const json = await r.json();

    // Microlink data fields 예시: title, image 등 :contentReference[oaicite:6]{index=6}
    const data = json?.data || {};
    const out = {
      ok: true,
      title: data.title || "",
      image: data.image?.url || data.image || "",
      // screenshot은 활성화했을 때만 들어올 수 있음
      screenshot: data.screenshot?.url || data.screenshot || "",
      // 디버깅에 도움 되는 statusCode
      statusCode: data.statusCode ?? json?.statusCode,
    };

    return res.status(200).json(out);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: "Server fetch failed", detail: e?.message });
  }
}