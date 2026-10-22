# matchtempo.app

The public website: a holding page, the `/get` link, privacy and support. Plain static files, no build step.

| Path | Purpose |
|---|---|
| `/` | What MatchTempo is, and **Join the beta** |
| `/get/` | The one link we share. Edit `TARGET` in `get/index.html`: the TestFlight public link during the beta, the App Store link after launch. Empty shows "not ready yet". |
| `/terms/` | Terms of use. Beta draft, version 0.5. The app's sign-up links here. |
| `/privacy/` | Privacy policy (needed for Apple Health, TestFlight and sign-up). Beta draft, version 0.5.1. |
| `/terms/<version>/`, `/privacy/<version>/` | A frozen copy of each published version, so we can always show what someone agreed to. `/privacy/2026-10-13/` is the draft from before versions. |
| `/support/` | Contact and common questions |
| `/game/` | Read-only page for a shared game link (`/game/#<token>`). Copied from `web/game/` in the app repository (without `test/` and `README.md`); `config.js` holds the Supabase project URL and **publishable** key only. Update it by copying again from there. |
| `/join/` | Group join link (`/join/#<token>`). With the app installed, iOS opens the app instead of this page (universal link); otherwise the page says to get the app and tap the link again. The token stays in the fragment, so it never reaches the server. Browser joining comes later (B-15). |
| `.well-known/apple-app-site-association` | Tells iOS that `/join/*` links belong to the app `RALVGAQC3U.app.matchtempo`. `_config.yml` keeps the dot folder in the GitHub Pages build. |
| `404.html` | Not-found page |
| `CNAME` | Tells GitHub Pages the custom domain |

Fonts are Big Shoulders (SIL Open Font License, `assets/OFL.txt`). Logos come from the MatchTempo design system.

## Terms and privacy versions

The app records which version of each page someone agreed to (`legal.documents` and `identity.consents` in the app repository's Supabase backend). Each page states its version three ways, which must always match the latest row for that page in `legal.documents`:

- the banner at the top (`Beta draft · version 0.1 · 17 Oct 2026`) and the line under the title;
- `<meta name="matchtempo:version" content="0.1">` and `matchtempo:published` in the `<head>`, for anything that needs to read the version from the page.

To publish a new version:

1. Edit `/terms/index.html` or `/privacy/index.html`: new version number and date in the banner, the meta line and the meta tags, and add it to the Earlier versions list.
2. Copy the page to `/terms/<version>/index.html` (or `/privacy/...`) and add a `rel="canonical"` link to the main page. Never edit a frozen copy afterwards.
3. Add the matching row to `legal.documents` with a migration in the app repository. Mark it `major` only if people must agree again; a major version makes Play ask everyone to agree on next open.
4. Merge the site change and the migration together, so the page and the server never disagree.

Drop "Beta draft" from the banner only after the legal check (Book of Work O-57).

## Publishing on GitHub Pages

1. Create a **public** repository, for example `HeroicAB/matchtempo-site` (GitHub Pages is free for public repositories; the app repository stays private). Put these files at its root and push to `main`.
2. In the repository: Settings → Pages → Source "Deploy from a branch", branch `main`, folder `/`. Set the custom domain to `matchtempo.app`.
3. At the domain registrar, add DNS records for the apex `matchtempo.app` (check the current values in GitHub's Pages documentation before entering them):
   - `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - optionally `CNAME` for `www` pointing to `heroicab.github.io`
4. Once GitHub has issued the certificate, tick **Enforce HTTPS**. `.app` domains only load over HTTPS, so the site won't open until this step is done.
5. Recommended: verify the domain in your GitHub account settings (Pages → Verified domains) so nobody else can claim it.

## Email

`support@matchtempo.app` is an iCloud Mail custom-domain address. To keep it away from simple scrapers, no page has the address or a `mailto:` link in its HTML: links are written as `<a class="email" data-user="support" data-host="matchtempo app">support at matchtempo dot app</a>` and `assets/contact.js` turns them into a normal email link in the browser. Include that script on any page that uses the link. Without JavaScript, visitors see the readable "at ... dot" form.
