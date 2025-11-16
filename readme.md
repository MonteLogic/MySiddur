# About Contractor Bud

Contractor Bud is an online system for managing contractors concerns. These concerns include
scheduling, timecards, route management and time management.

This easy to use app will make truck drivers and route managers working lives much easier.

The goal is to have users manage their contracting company easily, these include timecards, schedules, hours and more.

To see the live project vist:
<https://cbud.app>

## Running Locally

Install dependencies:

```sh
pnpm install
```

Start the dev server:

```sh
pnpm dev
```

### Disabling Clerk Authentication (Development Only)

For local development, you can disable Clerk authentication by setting the `DISABLE_CLERK` environment variable in your `.env.local` file:

```bash
DISABLE_CLERK=true
```

**Important Notes:**

- **Development Only**: This option is **ONLY** for local development. It will **block builds and deployments** if set.
- **Workflow**: 
  1. Add `DISABLE_CLERK=true` to your `.env.local` file
  2. Restart the dev server (`pnpm run dev`)
  3. You'll see a warning notice that Clerk is disabled
  4. All routes will be accessible without authentication
  5. **Before deploying**: Remove `DISABLE_CLERK` from your environment variables
- **Build Protection**: The build process will fail if `DISABLE_CLERK` is detected, preventing accidental deployments without authentication
- **Re-enabling Clerk**: Simply remove `DISABLE_CLERK=true` from `.env.local` and restart the dev server

**Why use this?**
- Useful when Clerk's inline browser authentication doesn't work in your development environment
- Allows testing the app without authentication setup
- Speeds up local development when you don't need auth features

## Documentation

<https://nextjs.org/docs>

{
"routes": {
"1": "626L4"
}
}

This repo is using webhooks from Clerk to sync the users with the clerk db.

## Node Version

node-version: 20.0.x

## Code Guidelines

TypeScript and JavaScript should be JSDoc compliant.

## Setup Blog Content:

node-version: 20.0.x

```bash

git submodule init
git submodule update

```
