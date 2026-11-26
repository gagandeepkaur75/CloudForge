# CloudForge UI redesign

## What changed
- Replaced the former public landing page with a responsive SaaS-style landing page and product preview.
- Added dedicated public pages for Features, Architecture, Team, How It Works, Documentation and About.
- Added client-side navigation with browser back/forward support.
- Kept the existing login component and authenticated workspace components intact.
- Added an SPA rewrite file at `frontend/public/_redirects` for hosts that support Netlify-style redirects.

## Run locally
1. Open a terminal in `frontend`.
2. Run `npm install`.
3. Run `npm run dev`.

## Notes
- The architecture page is a high-level representation based on the project repository; verify actual deployed AWS resources before presenting them as live.
- A production static host must be configured to rewrite unknown routes to `index.html`. The `_redirects` file covers hosts that support this convention; AWS Amplify/CloudFront may require an equivalent rewrite rule in hosting settings.
- Build verification could not be completed in this environment because the Vite dependency was not installed and package registry access was unavailable.
