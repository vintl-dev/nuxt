# VIntl for Nuxt monorepo

This monorepo hosts the VIntl for Nuxt module as well as other projects that help building it.

## Project structure

**Legend**: 🔒 Private · 🌐 Website

### Apps

- [Playground](https://github.com/vintl-dev/nuxt/tree/main/apps/playground) 🔒
- [Docs](https://github.com/vintl-dev/nuxt/tree/main/apps/docs) 🔒 [🌐](https://vintl-nuxt.vercel.app/)

### Packages

- [VIntl for Nuxt module](https://github.com/vintl-dev/nuxt/tree/main/packages/vintl-nuxt)
- [ESLint config](https://github.com/vintl-dev/nuxt/tree/main/packages/eslint-config) 🔒
- [Playground translations](https://github.com/vintl-dev/nuxt/tree/main/packages/translations) 🔒

## Working with this monorepo

If you want to contribute a change or just want to try some changes in the project, follow the instruction below to get started.

> **Note** Corepack is recommended! It allows you to quickly switch package managers and their versions. As this monorepo uses pnpm, it is specified in root `package.json`, so you can use `corepack prepare --activate` to quickly switch to the version recommended for this repository. See [corepack docs](https://nodejs.org/api/corepack.html) for details.

1. **Clone the repository**

   ```bash
   git clone https://github.com/vintl-dev/nuxt.git vintl-nuxt
   cd vintl-nuxt
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Prepare apps** (optional)

   This will build the module and prepare all the apps, such as sandbox and docs.

   ```
   pnpm all:prepare
   ```

4. **Build module**

   ```bash
   pnpm mod:build
   ```

5. **Start playground**

   Running playground in dev mode you can play and test that the module works in a regular Nuxt project.

   ```bash
   pnpm pg:dev
   ```

6. **Create a changeset**

   If you want to make a contribution to the module, make a changeset. This will ask you about the level of change (patch, minor or major) and the description of the change made.

   You don't need changesets for private packages (like playground).

   ```bash
   pnpm changeset
   ```

> **Warning** Do not run commands like `pnpm add` when your working directory is not set to the monorepo root. `pnpm` seems to ignore top-level `.npmrc` and will reinstall dependency tree in a manner currently incompatible with Nuxt. Use `pnpm --filter <pkg/relative-path> add` from the root. A lot of convenient scripts utilising Turborepo are also available in monorepo's `package.json`. You rarely need to `cd` into subdirectories.
