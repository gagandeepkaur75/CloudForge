# CloudForge bug-fix changes (2026-11-27)

## 1. Backend replaced with the newer version
`backend/` and `infrastructure/` now come from the newer backend.zip. The old GitHub backend
logged everyone in as `anonymous@student.edu`; the new one requires a real, verified Cognito ID
token (the frontend already sends this). `infrastructure/template.yaml` is the newer template plus
the monitoring thread's additions (PITR backups, alarms, log retention, `ExposedHeaders` typo fix).
`DEPLOYMENT.md` explains how to deploy. Do NOT use the old `setup_aws.sh/.ps1` scripts.

## 2. Uploads failed
The backend returns the signed upload headers as `headers`, but the frontend read `uploadHeaders`
(always empty), so S3 rejected every upload. Fixed in `pages/ProjectWorkspace.jsx`. Also files with
no browser type now send `application/octet-stream` both when asking for the URL and when uploading,
because S3 checks that they match.

## 3. Download buttons
Added two backend endpoints in `backend/api_handler/main.py`:
- `GET /projects/{id}/files/{name}/download` - 5-minute download link for the current file
- `GET /projects/{id}/files/{name}/versions/download?versionId=...` - same for an old version
Both check project membership and write a FILE_DOWNLOADED activity log.

## 4. Snapshot list
Frontend now calls `GET /snapshots` (one call) instead of a per-project path that did not exist.
The backend now also saves who created the snapshot, when (readable date) and how many files,
so the table shows them. The list refreshes after you create a snapshot.

## 5. Seven actions switched on (`services/api.js`)
Edit project, delete project (empty projects only), list/create/delete folders (delete only
empty folders), change a member's role, remove a member. The Team page now reloads after role
changes/removals. Workspace now shows saved folders, not just folders that already have files.

## Smaller fixes
- Error messages now show the backend's real reason (e.g. "Delete active files before deleting
  the project") instead of "Request failed with status code 409".
- File Sharing page: "7 Days" removed (backend max is 24 h). The share-link list shows links
  created in this browser tab, since the backend does not store them; the page no longer shows
  an error on load.
- Home page architecture card says "Amazon S3 + CloudFront" instead of Vercel.

## Still not implemented (shows a clear message)
Rename file, revoke a share link early (S3 pre-signed links can't be revoked), AWS Backup
info/restore. Note: share links may stop working early when the lab session's credentials expire.

## How it was checked
- `npm ci && vite build` succeeds.
- Backend tested locally with fake AWS (moto): create project, upload URL headers, download,
  version list + old-version download, edit project, folders, member role change/removal,
  snapshot + snapshot list, delete-project block, and 403 for a non-member. All passed.
- Not tested against real AWS (nothing is deployed yet).
