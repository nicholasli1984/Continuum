export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://gocontinuum.app");

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing url", items: [] });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ContinuumApp/1.0; +https://continuum-azure.vercel.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      return res.status(200).json({ items: [], error: `Feed returned ${response.status}` });
    }

    const xml = await response.text();

    const getTag = (str, tag) => {
      const m = str.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };

    const getLink = (str) => {
      // <link>url</link> or <link href="url"/>
      const plain = str.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
      if (plain) return plain[1].trim();
      const attr = str.match(/<link[^>]+href="([^"]+)"/i);
      if (attr) return attr[1];
      return "";
    };

    const getMedia = (str) => {
      // <media:thumbnail url="..."/> or <media:content url="..."/> or <enclosure url="..."/>
      const m1 = str.match(/<media:thumbnail[^>]+url="([^"]+)"/i);
      if (m1) return m1[1];
      const m2 = str.match(/<media:content[^>]+url="([^"]+)"/i);
      if (m2) return m2[1];
      const m3 = str.match(/<enclosure[^>]+url="([^"]+)"/i);
      if (m3) return m3[1];
      // Try first <img src in description
      const desc = getTag(str, "description");
      const img = desc.match(/<img[^>]+src="([^"]+)"/i);
      if (img) return img[1];
      return null;
    };

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
      const raw = match[1];
      const desc = getTag(raw, "description")
        .replace(/<[^>]*>/g, "")
        .replace(/&[a-z]+;/g, " ")
        .trim()
        .slice(0, 160);

      items.push({
        title: getTag(raw, "title"),
        link: getLink(raw),
        pubDate: getTag(raw, "pubDate"),
        description: desc ? desc + "…" : "",
        guid: getTag(raw, "guid") || getLink(raw),
        thumbnail: getMedia(raw),
      });
    }

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(200).json({ items: [], error: e.message });
  }
}
