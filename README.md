# MariKit

MariKit is a collection of browser-based tools for working with documents, QR codes, and security-related utilities.

The project is designed to keep supported processing on the user's device. Files and input should not leave the browser unless a feature clearly states otherwise.

MariKit is still under development. Some tools may be incomplete or change as the project evolves.

## Available tools

Current areas of development include:

- PDF utilities
- QR code generation and scanning
- Encryption and hashing utilities

## Built with

- Nuxt
- Vue
- TypeScript
- Tailwind CSS
- Vitest

## Run locally

Clone the repository and install the dependencies:

```bash
git clone https://github.com/MarchRun/MariKit.git
cd MariKit
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

You can also generate a static build:

```bash
npm run generate
```

## Tests

Run the test suite with:

```bash
npm test
```

Run the full suite once:

```bash
npm test -- --run
```

Run type checking:

```bash
npm run typecheck
```

See [the functional test catalogue](tests/README.md) for the tested scenarios, real PDF/QR integration checks, simulated browser APIs, and remaining device/browser verification requirements.

### Continuous integration

The [CI workflow](.github/workflows/ci.yml) runs on pushes, pull requests, and manual dispatch using Node.js 24 on Ubuntu 24.04. It installs dependencies with `npm ci`, then runs the tests, type checking, and production build. It does not deploy the application or require repository secrets. Action references are pinned to commit SHAs.

After pushing the workflow, check the repository's Actions tab for its first result. Requiring CI before merging is a separate repository ruleset setting; the workflow does not enable it automatically.

## Project structure

```text
logic/      Reusable application logic
pages/      Application routes
public/     Public assets
server/     Server routes and middleware
ui/         Reusable interface components
utils/      Shared helper functions
```

## Privacy

MariKit aims to process supported data in the browser and avoid permanent storage of personal files. Features that require a server or an external service should disclose that behavior before sending any data.

Do not use the application for sensitive material until the relevant tool has been reviewed and tested for your use case.

## Contributing

Bug reports and feature suggestions are welcome through GitHub Issues.

If you want to contribute code, open an issue first so the proposed change can be discussed before implementation.

## License

MariKit is available under the [MIT License](LICENSE).
