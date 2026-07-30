## Your First App

Congratulations on creating your first app! Feel free to replace this text with your app's actual description.

### Folder structure explained

    .
    ├── README.md                  This file
    ├── app                        Contains the files that are required for the front end component of the app
    │   ├── app.js                 JS to render the dynamic portions of the app and talk to Plentymarkets
    │   │                          via Platform 3.0 request templates (client.request.invokeTemplate())
    │   ├── icon.svg               Sidebar icon SVG file. Should have a resolution of 64x64px.
    │   ├── freshdesk_logo.png     The Freshdesk logo that is displayed in the app
    │   ├── style.css              Style sheet for the app
    │   ├── template.html          Contains the HTML required for the app’s UI
    ├── config                     Contains the installation parameters and OAuth configuration
    │   ├── iparams.json           Contains the parameters that will be collected during installation
    │   ├── iparams.html           Custom installation page (validates credentials via request templates)
    │   ├── requests.json          Platform 3.0 request templates used by the app (login, getWorkitem,
    │   │                          getOrderNumberItems, validateCredentials) - replaces the old
    │   │                          server.js/server/lib/api.js serverless backend
    │   └── iparam_test_data.json  Contains sample Iparam values that will used during testing
    └── manifest.json              Contains app meta data and configuration information

### Platform 3.0 migration notes

This app was migrated from FDK 2.0 / Platform 2.0 (front end -> server.js -> server/lib/api.js ->
Shopware/PlentyMarkets REST API) to FDK 10.1.8 / Platform 3.0. All backend HTTP calls are now declared
as request templates in `config/requests.json` and invoked directly from `app/app.js` and
`config/iparams.html` using `client.request.invokeTemplate()`. `server.js` and `server/lib/*` have been
removed entirely - they are no longer needed since request templates eliminate the need for a serverless
component to reach third-party domains.
