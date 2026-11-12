# litra

Library and CLI to control the [Logitech Litra Glow](https://www.logitech.com/en-us/products/lighting/litra-glow.946-000001.html). Shoutout to [kharyam](https://github.com/kharyam/litra-driver) for having the details for communicating with the Litra.

- [`litra`](./litra) — the library
- [`litra-cli`](./litra-cli) — the command line app

## Development

Tooling and tasks are managed with [mise](https://mise.jdx.dev) ([Bun](https://bun.sh) + Node) and a [Bun workspace](https://bun.sh/docs/install/workspaces).

```sh
mise install            # provision Bun and Node
mise run install        # install dependencies
mise run ci             # lint, build, test, package, and native HID checks
mise run release minor  # prepare a release (major | minor | patch)
```

Linting and formatting use [Biome](https://biomejs.dev) (`mise run lint` / `mise run format`); tests use `bun test`.

`mise run install` reinstalls dependencies from the frozen lockfile and runs trusted lifecycle scripts, restoring native HID bindings even if a cached installation is incomplete. Use `bun add` or `bun update` when intentionally changing dependencies and commit the updated lockfile.

See [`DEPENDENCY_NOTES.md`](./DEPENDENCY_NOTES.md) for the dependency choices
made in the latest maintenance pass.

## Releases

Run `mise run release minor` (or `patch` / `major`) to update versions, build,
test, and check packaging. Land those version and lockfile changes through the
repository's normal review and CI process. This preparation does not publish.

Then run the **Release** GitHub Actions workflow on `main`. It checks the selected
revision and runs `mise run release current` to publish the versions already in
that revision. Both packages are packed with Bun (which resolves workspace
dependencies), then published with npm using GitHub OIDC and provenance. No npm
token is required. The task creates and pushes an annotated version tag and
creates a GitHub release; it does not push a commit to protected `main`.
Real publication is restricted to GitHub Actions on `main`.

Configure a GitHub Actions trusted publisher in npm for **each** package,
`@ryanwersal/litra` and `@ryanwersal/litra-cli`, with these exact values:

- Owner: `ryanwersal`
- Repository: `litra`
- Workflow filename: `release.yml`
- Environment: leave blank
- Permission: publish

The workflow installs npm 11.16.0 for trusted publishing support while retaining
the repository's existing mise toolchain. `DRY_RUN=1 mise run release current`
validates build, tests, and packaging without publishing, tagging, or pushing;
it does not validate the npm trust relationship. Use a disposable checkout for
release rehearsals.
