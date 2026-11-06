# litra

Library and CLI to control the [Logitech Litra Glow](https://www.logitech.com/en-us/products/lighting/litra-glow.946-000001.html). Shoutout to [kharyam](https://github.com/kharyam/litra-driver) for having the details for communicating with the Litra.

- [`litra`](./litra) — the library
- [`litra-cli`](./litra-cli) — the command line app

## Development

Tooling and tasks are managed with [mise](https://mise.jdx.dev) ([Bun](https://bun.sh) + Node) and a [Bun workspace](https://bun.sh/docs/install/workspaces).

```sh
mise install            # provision Bun and Node
mise run install        # install dependencies
mise run ci             # lint, build, test, and native HID smoke check
mise run release minor  # cut a release (major | minor | patch)
```

Linting and formatting use [Biome](https://biomejs.dev) (`mise run lint` / `mise run format`); tests use `bun test`.

`mise run install` reinstalls dependencies from the frozen lockfile and runs trusted lifecycle scripts, restoring native HID bindings even if a cached installation is incomplete. Use `bun add` or `bun update` when intentionally changing dependencies and commit the updated lockfile.
