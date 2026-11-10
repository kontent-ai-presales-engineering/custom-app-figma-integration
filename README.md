# Figma to Kontent.ai custom app

A [Kontent.ai custom app](https://kontent.ai/learn/docs/custom-apps) that lets you browse Figma designs from inside Kontent.ai and turn a Figma frame into a content type and a content item.

Built with React, TypeScript and Vite, based on the [Kontent.ai custom app starter](https://github.com/kontent-ai/custom-app-starter-react).

## What it does

1. **Pick a Figma file.** Paste a Figma file URL or key, reopen a recently used file, or (when a Figma team ID is configured) browse the team's folders, subfolders and files.
2. **Pick a frame.** The app lists the pages and top-level frames in the file.
3. **Preview.** A rendered image of the frame is shown, fetched from the Figma API.
4. **Map and import.** The frame's layers are mapped to content type elements:
   - Text layers become **text** elements, with the layer's text as the value.
   - Layers with an image fill become **asset** elements (left empty, upload the image yourself).
   - Hidden layers are skipped. Auto-named text layers get logical names such as *Headline*, *Subheading* and *Body*.

   You can rename the content type and every element, and edit their codenames, before importing.
5. **Create in Kontent.ai.** With the Management API, the app creates:
   - a new **content type** with the mapped elements,
   - a new **content item** of that type,
   - a **language variant** in the environment's default language, filled with the text from the frame.

The Kontent.ai environment ID is read automatically from the custom app context.

## Prerequisites

- A Kontent.ai environment where you can manage custom apps (**Environment settings** > **Custom apps**).
- A **Kontent.ai Management API key** for that environment that can create content types and content items.
- A **Figma personal access token** (Figma > **Settings** > **Security** > **Personal access tokens**) with these scopes:
  - **Files: Read the contents of and render images from files** (`file_content:read`), required.
  - **Folders: Read team folder structure** (`folders:read`), only needed for team browsing.
- Node.js and [pnpm](https://pnpm.io/).
- A place to host the app over HTTPS, for example Vercel or Netlify.

## Run locally

```bash
pnpm i
pnpm dev
```

The dev server runs on `https://localhost:5173` with a self-signed certificate (custom apps must be served over HTTPS). Your browser will show a certificate warning the first time: accept it, otherwise Kontent.ai can't load the app in its iframe.

Other commands:

```bash
pnpm build     # type-check and build to dist/
pnpm preview   # serve the production build
```

## Deploy

Build with `pnpm build` and host the `dist` folder on any static HTTPS host.

**Vercel:** import this repository as a new project. Vercel detects Vite and uses `dist` as the output directory. The included [vercel.json](vercel.json) adds an `X-Robots-Tag: noindex, nofollow` header so the app isn't indexed by search engines.

Kontent.ai loads custom apps in an iframe. If your host sends `X-Frame-Options` or `Content-Security-Policy` headers, they must allow `https://app.kontent.ai` as a frame ancestor.

## Install in Kontent.ai

1. In Kontent.ai, go to **Environment settings** > **Custom apps**.
2. Click **Create new custom app**.
3. Fill in:
   - **App name**: for example `Figma import`.
   - **Hosted code URL (HTTPS)**: the URL of your deployment (or `https://localhost:5173` while developing).
   - **Roles that can work with this app**: the roles that should see the app.
   - **Display mode**: **Full screen** is recommended, the import screen needs the space.
   - **Parameters {JSON}**:

     ```json
     {
       "figmaToken": "figd_your_figma_personal_access_token",
       "kontentApiKey": "your_kontent_management_api_key",
       "figmaTeamId": "optional_figma_team_id"
     }
     ```

4. Click **Save changes**. The app now shows up for users with the selected roles.

| Parameter | Required | Description |
| --- | --- | --- |
| `figmaToken` | Yes | Figma personal access token, see [Prerequisites](#prerequisites). |
| `kontentApiKey` | Yes | Management API key for the environment the app is installed in. |
| `figmaTeamId` | No | Enables browsing the team's folders and files. Find it in the Figma URL when you open your team: `figma.com/files/team/<TEAM_ID>/...` |

If a required parameter is missing, the app shows a configuration screen that lists what's missing.

## Security note

This app is meant for demos and internal use. It calls the Figma and Kontent.ai APIs directly from the browser, so both tokens from **Parameters {JSON}** reach the browser of every user who opens the app and can be read with the browser's developer tools. Kontent.ai's documentation also advises against storing secrets in the custom app parameters.

To limit the risk:

- Use a dedicated Management API key with only the permissions the app needs, and give the app only to roles you trust with that key.
- Use a Figma token with only the scopes listed above, and rotate both tokens regularly.
- For production use, move the API calls behind a server-side proxy that holds the secrets. See [sensitive data in custom elements](https://kontent.ai/learn/develop/integrate/worked-examples/sensitive-data-in-custom-elements) for the pattern.

## Project structure

```
src/
  App.tsx                    Step flow: files > frames > preview > import
  components/
    FileBrowser.tsx          Open by URL, recent files, team folder browsing
    FrameBrowser.tsx         Pages and frames in a Figma file
    FramePreview.tsx         Rendered preview of a frame
    ImportPanel.tsx          Element mapping and import into Kontent.ai
    ConfigError.tsx          Shown when parameters are missing
  contexts/AppContext.tsx    Custom App SDK context and config
  services/
    figmaApi.ts              Figma REST API client
    kontentApi.ts            Kontent.ai Management API client
  utils/mapping.ts           Figma layers to Kontent.ai elements
```

## Learn more

- [Kontent.ai custom apps](https://kontent.ai/learn/docs/custom-apps)
- [Kontent.ai Custom App SDK](https://github.com/kontent-ai/custom-app-sdk-js)
- [Figma REST API](https://developers.figma.com/docs/rest-api/)

## License

MIT, see [LICENSE.md](LICENSE.md).
