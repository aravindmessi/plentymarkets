# Platform 3.0 / FDK 10.1.8 Migration Notes

## What changed

**Removed entirely** (no longer needed):
- `server.js`
- `server/lib/api.js`
- `server/lib/handle-response.js`

These implemented the old flow `app.js -> server.js -> lib/api.js -> PlentyMarkets REST API`.
Platform 3.0's request-template mechanism (`config/requests.json` +
`client.request.invokeTemplate()`) lets the front end call the third-party API directly and
securely, so the serverless hop is unnecessary.

**Added**
- `config/requests.json` - four request templates:
  - `login` - obtains an access token using the stored `SWdomain` / `client_id` / `client_secret`
    installation parameters (used by the main app at ticket-sidebar runtime).
  - `validateCredentials` - identical login call, but takes domain/username/password as runtime
    `context` instead of stored iparams, so it can be used from `config/iparams.html` *before* the
    app is installed (iparams aren't saved yet at that point).
  - `getWorkitem` - looks up orders by the ticket requester's email (`contactData`).
  - `getOrderNumberItems` - looks up orders by Order ID.

**Changed**
- `app/app.js` - replaced all `client.request.invoke('...Invoke', ...)` calls (which hit the
  removed serverless functions) with a small `invokeWithAuth()` helper that calls
  `client.request.invokeTemplate()` directly, attaches the bearer token obtained from the `login`
  template, and transparently re-authenticates once if a call comes back 401/419 (token expiry).
  Response parsing was simplified from `JSON.parse(data.response.response)` (double-encoded because
  the old server.js/`$request` layer wrapped the third-party response) to a single
  `JSON.parse(data.response)`, since `invokeTemplate()` returns the third-party response directly.
- `config/iparams.html` - the `validateStore()` function's ad-hoc `client.request.post()` call
  (deprecated pre-FDK-9 API) is now `client.request.invokeTemplate('validateCredentials', ...)`.
- `app/template.html`, `app/modal.html`, `app/notesmodal.html`, `config/iparams.html` - the static
  `<script src="https://static.freshdev.io/fdk/2.0/assets/fresh_client.js">` include was replaced
  with the Platform-3.0-templated `<script src="{{{appclient}}}"></script>`.
- `manifest.json` - `modules.common.requests` now declares the four request templates above
  instead of the three serverless SMI functions (`generateAccessToken`, `getWorkitem`,
  `getOrderNumberItems`) that used to live under `modules.common.requests` pointing at `server.js`.

## Assumption you should double-check

`client_secret` is used directly inside the JSON body of the `login` / `validateCredentials`
request templates (`{"username": "...", "password": "..."}"`), matching the original app's
behaviour. **Platform 3.0 request templates do not allow iparams flagged `"secure": true` to be
used anywhere except request headers** - if your `config/iparams.json` marks `client_secret` as a
secure iparam, `fdk validate`/`fdk run` will reject the `login` template's body. If that's the
case for your `iparams.json` (not included in the material provided for this migration), you have
two options:
1. Un-mark `client_secret` as secure (functionally identical to the original app, which already
   sent it in plaintext to `server.js`), or
2. Switch the PlentyMarkets login call to HTTP Basic Authentication in the `Authorization` header
   (if the `/rest/login` endpoint on your PlentyMarkets version supports it) using
   `"Authorization": "Basic <%= encode(iparam.client_secret) %>"`, which *is* permitted for secure
   iparams.

## Not touched

`app/style.css`, `app/css/style.css`, `app/scss/style.scss`, `app/icon.svg`, `app/js/index.js`,
`app/license.txt`, `.fdk/configs.json`, and `config/iparams.json` / `config/iparam_test_data.json`
required no changes for this migration (pure UI/config, no HTTP calls) and should be carried over
unchanged from your existing project. `app/app_modal.js` (referenced by `modal.html` /
`notesmodal.html`) was not part of the supplied project files, so it was left untouched — if it
makes any API calls of its own, apply the same `invokeWithAuth()` pattern used in `app/app.js`.
