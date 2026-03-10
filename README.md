# HovenierKoning (Klus4Me)

Bomeninventarisatie-app gebouwd met Quasar Framework (Vue 3 + TypeScript).

## Vereisten

- Node.js 18+
- npm 9+

## Installatie

```bash
npm install
```

## Development

Start de app in development mode:

```bash
quasar dev
```

Start in PWA development mode:

```bash
quasar dev -m pwa
```

## Build

Standaard (SPA) build:

```bash
quasar build
```

PWA build (met service worker):

```bash
quasar build -m pwa
```

## Build lokaal serveren

Na een build kan je de output lokaal runnen met Quasar Serve:

```bash
quasar serve dist/spa
```

Voor PWA build output:

```bash
quasar serve dist/pwa
```

Gebruik `--history` enkel wanneer je router in history mode staat.

## Codekwaliteit

Lint:

```bash
eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"
```

Format:

```bash
prettier --write "**/*.{js,ts,vue,scss,html,md,json}" --ignore-path .gitignore
```

## Alternatief via npm scripts

Je kan dezelfde Quasar workflow ook via scripts starten:

- `npm run dev` → `quasar dev`
- `npm run dev:pwa` → `quasar dev -m pwa`
- `npm run build` → `quasar build`
- `npm run build:pwa` → `quasar build -m pwa`
- `npm run lint` → ESLint controle
- `npm run format` → Prettier formatting

## Projectstructuur (kern)

- `src/components` – UI componenten
- `src/composables` – herbruikbare logica
- `src/layouts` – app layout(s)
- `src/pages` – router pagina’s
- `src/boot` – Quasar boot files (startup initialisatie)

## Configuratie

- Quasar configuratie: `quasar.config.ts`
- API boot/provisioning: `src/boot/axios.js`

Zie ook de Quasar documentatie:

- https://quasar.dev
- https://v2.quasar.dev/quasar-cli-vite/quasar-config-file
