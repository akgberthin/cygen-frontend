# CYGEN Equities — public marketing website

Marketing site for CYGEN Equities (cygenequities.com), an equity-based property
partnership platform. React (CRA) frontend, FastAPI backend, MongoDB storage.

## Run

Services are supervisor-managed in this environment (`sudo supervisorctl restart
frontend|backend` after changing `.env` files or installing dependencies).

## Environment variables

Backend (`backend/.env`):
- `MONGO_URL`, `DB_NAME` — MongoDB connection (pre-configured).
- `CORS_ORIGINS` — allowed origins (pre-configured).
- `ADMIN_PASSWORD` — password for the `/admin` page and the `/api/admin/*`
  endpoints (sent as the `X-Admin-Password` header).
- `CYGEN_LEAD_WEBHOOK_URL` — optional. If set, every stored lead and workshop
  registration is POSTed to this URL as `{"type": "lead"|"workshop_registration",
  "record": {...}}`.
- `CYGEN_LEAD_WEBHOOK_SECRET` — optional. If set, webhook requests carry an
  `X-Cygen-Signature: sha256=<hmac>` header (HMAC-SHA256 of the raw body).

Frontend (`frontend/.env`):
- `REACT_APP_BACKEND_URL` — API base URL (pre-configured).
- `REACT_APP_APPLY_URL` — optional. Destination of the "Apply" buttons and path
  CTAs. When set, visitors go there with `?path=purchase` or `?path=refinance`
  appended when they used a path button. When empty, Apply links fall back to the
  contact page with the same query parameter.

## Adding a language

1. Copy `frontend/src/i18n/locales/en.json` to `<code>.json` and translate every value.
2. Add one entry to `LOCALES` in `frontend/src/i18n/registry.js`.
3. Run `pytest tests/test_translations.py` — it enforces key parity and the
   banned-word list, so a new locale cannot drift.

The visitor's language is stored in `localStorage` (`cygen-lang`), defaults from
the browser language, updates `<html lang>`, carries the locale in the URL
(`/en/...`, `/es/...`) and renders hreflang alternates on every page. Missing keys
fall back to English and are logged to the console in development.

## Brand tokens

All colors live in two mirrored places:
- `frontend/src/theme/tokens.json` — the source checked by the contrast tests.
- `frontend/src/index.css` — the same values as CSS variables under
  `html.dark` / `html.light`.

Change both together, then run `pytest tests/test_contrast.py` to confirm both
themes still pass WCAG 2.2 AA (4.5:1 text, 3:1 non-text). Radius: 10px cards,
7px inputs/buttons (Tailwind `rounded-[10px]` / `rounded-[7px]`). System font
stack only — do not add web fonts.

## Theme switch

System / Dark / Light, persisted in `localStorage` (`cygen-theme`). Dark is the
brand default for first-time visitors. An inline script in
`frontend/public/index.html` applies the stored choice before first paint (no
flash) and updates `color-scheme` and the `theme-color` meta.

## Language rules for copy

Never use, in either language: borrower, lender, loan, interest, amortization,
term, maturity, payoff, delinquency, default, acceleration, foreclosure, late fee
(and the Spanish equivalents listed in `tests/test_translations.py`). Spanish uses
"caducidad", never "vencimiento". The test suite scans both dictionaries. The
legal document names "Terms of use" / "Términos de uso" (plural) are intentional
and not flagged.

## Tests

```
pytest tests/
```

- `test_translations.py` — EN/ES key parity, banned-word scan, FAQ size, fixed legal strings.
- `test_contrast.py` — computed WCAG contrast for both themes.
- `test_api.py` — lead/registration validation, honeypot, admin guard, CSV export, rate limiting.

## API

- `POST /api/leads` — contact lead (name, email or phone, preferred_language,
  path_interest purchase|refinance|unsure, message, consent, `website` honeypot).
  Rate-limited per IP; honeypot submissions return success but are not stored.
- `GET /api/workshops` — the 3 sample workshops with remaining places.
- `POST /api/workshops/{id}/registrations` — workshop registration (same protections).
- `GET /api/admin/leads`, `GET /api/admin/registrations`,
  `GET /api/admin/export.csv?kind=leads|registrations` — require
  `X-Admin-Password` header.

## Assumptions made during the build

- `REACT_APP_APPLY_URL` is unset for now; Apply buttons route to the contact page
  with `?path=` until the real application URL is provided.
- Default theme choice is "Dark" (brand default) rather than "System".
- The admin area uses a single shared password from `ADMIN_PASSWORD` (no user accounts).
- Rate limiting is in-memory per process: 10 POSTs per endpoint per IP per 10 minutes.
- Honeypot submissions get a success response but are silently discarded.
- Workshop schedule is sample data defined in `backend/server.py` (`WORKSHOPS`);
  titles/descriptions live in the i18n dictionaries.
- All three sample workshops are online (no physical venue is published).
- All site content is sample content for review; the Legal page sections are
  marked "Draft — counsel to confirm".
