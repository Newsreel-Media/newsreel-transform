# Newsreel Transform

Turn any article into an interactive slide-based story. One URL in, Newsreel story out.

## Entry Points (planned)
1. **Web page**: `newsreel.co/transform?url=...` — paste a URL, get slides
2. **Bookmarklet**: Drag to bookmarks bar, click on any article
3. **Embed widget**: `<newsreel-story url="...">` — publishers drop on their site
4. **API**: `POST /api/v1/transform` — programmatic access

## Stack
- Next.js (shared with CMS)
- @mozilla/readability + jsdom (article extraction)
- Claude API (slide generation)
- Vanilla JS slide renderer (<30KB for embeds)

## Status
- [ ] Research complete
- [ ] Executive review
- [ ] MVP prototype
- [ ] Bookmarklet
- [ ] Embed widget
