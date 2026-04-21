import React from "react";
export function renderNews(s) {
  const { css, isMobile, darkMode, newsItems, newsLoading, newsError, fetchNews, NEWS_SOURCES } = s;
  const D = darkMode;
    const filtered = newsSourceFilter === "all" ? newsArticles : newsArticles.filter(a => a.source === newsSourceFilter);
    return (
      <div>
        <div className="c-a1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: css.text3, marginBottom: 8 }}>Points & Travel</div>
            <h2 style={{ fontFamily: "'Instrument Sans', 'Outfit', sans-serif", fontSize: isMobile ? 28 : 36, fontWeight: 600, color: css.text, margin: 0, lineHeight: 1.1 }}>News & Deals</h2>
            <p style={{ color: css.text2, fontSize: 13, margin: "8px 0 0" }}>Latest posts from top travel & points blogs</p>
          </div>
          <button onClick={fetchNews} disabled={newsLoading} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8,
            border: `1px solid ${css.border}`, background: css.surface, color: css.text2,
            fontSize: 12, fontWeight: 600, cursor: newsLoading ? "default" : "pointer", opacity: newsLoading ? 0.6 : 1,
          }}>
            {newsLoading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>

        {/* Source filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
          {[{ id: "all", name: "All Sources", color: css.accent }, ...NEWS_SOURCES].map(src => {
            const active = newsSourceFilter === src.id;
            return (
              <button key={src.id} onClick={() => setNewsSourceFilter(src.id)} style={{
                padding: "5px 12px", borderRadius: 20, border: `1px solid ${active ? src.color : css.border}`,
                background: active ? `${src.color}18` : css.surface, color: active ? src.color : css.text3,
                fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all 0.15s",
              }}>{src.name}</button>
            );
          })}
        </div>

        {/* Loading skeleton */}
        {newsLoading && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ height: 160, background: css.surface2, animation: "pulse 1.5s infinite" }} />
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ height: 10, width: "40%", background: css.surface2, borderRadius: 4, marginBottom: 10 }} />
                  <div style={{ height: 14, width: "90%", background: css.surface2, borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 14, width: "70%", background: css.surface2, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Articles grid */}
        {!newsLoading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: css.text3, fontSize: 14 }}>
            {newsFetched ? "No articles found for this source." : "Loading news…"}
          </div>
        )}

        {!newsLoading && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(article => (
              <a key={article.id} href={article.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{
                  background: css.surface, border: `1px solid ${css.border}`, borderRadius: 12, overflow: "hidden",
                  transition: "transform 0.15s, box-shadow 0.15s", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column",
                  borderTop: `3px solid ${article.sourceColor}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${article.sourceColor}20`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {article.thumbnail && (
                    <div style={{ height: 160, overflow: "hidden", background: css.surface2 }}>
                      <img src={article.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.currentTarget.parentElement.style.display = "none"; }} />
                    </div>
                  )}
                  <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                        color: article.sourceColor, fontFamily: "'Geist Mono', monospace",
                        background: `${article.sourceColor}15`, padding: "2px 7px", borderRadius: 4,
                      }}>{article.sourceName}</span>
                      <span style={{ fontSize: 10, color: css.text3, fontFamily: "'Geist Mono', monospace" }}>
                        {new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: css.text, lineHeight: 1.4, marginBottom: 8, fontFamily: "'Instrument Sans', 'Outfit', sans-serif" }}>
                      {article.title}
                    </div>
                    <div style={{ fontSize: 12, color: css.text3, lineHeight: 1.5, flex: 1 }}>
                      {article.description}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: article.sourceColor, fontWeight: 600 }}>Read more →</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // LOUNGES TAB
  // ============================================================
