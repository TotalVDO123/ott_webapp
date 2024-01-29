# Workspaces

## Why workspaces?

The JW OTT Web App is an open-source repository that showcases an OTT app implementing JWP services. The OTT Web App, as
the name implies, originates as a web only repository. But much of the source-code can be re-used for many different
platforms, like Capacitor, React Native, and other frameworks based on TypeScript.

Using the previous codebase, it would be quite challenging to re-use the services because of the dependencies and
browser usage. For example, the AccountController could redirect a user to a different page by using `window.location`.
This will never work in a non-browser environment and will most likely crash the app.

This means that we need to:

- Make most of the shareable code platform-agnostic
- Make most of the shareable code framework-agnostic
- Make importing services, controllers, stores, and utils possible in any other projects/platforms
- Benefit from linting based on the environment (Node, Browser, Vite, ...)
- Easy linking of packages/dependencies

## The solution

Based on the re-usability of parts of the existing codebase, we've created separate packages using Yarn Workspaces.
This will combine all similar code and prevent installing redundant or conflicting dependencies.

For example, all components, containers, and pages are be combined into the `packages/ui-react` package, which depends
on react and react-dom. To create a React Native app, you could add an `packages/ui-react-native` package and configure
aliases to use the correct package.

## Packages & Platforms

A split has been made between the platform and reusable code. All reusable code is further split into multiple packages.
This is mostly to separate the React from the non-react code.

Here is a breakdown of each package:

### Common

Name: `@jwp/ott-common`

The common package contains all non-react TypeScript code reusable between multiple frameworks. These are controllers,
services, stores, utilities, and typings. There should be no platform-specific dependencies like React or React DOM.

Typings can also be reused for multiple frameworks.

TypeScript is configured to prevent browser typings. You don't have access to Browser globals like `localStorage` or
`location`.

**Example usage:**

```ts
import { configureEnv } from '@jwp/ott-common/src/env';

configureEnv({
  APP_VERSION: 'v1.0.0',
});
```

### React Hooks

Name: `@jwp/ott-hooks-react`

Hooks are special because they are React-dependent but can be shared between the React and React Native frameworks.
That’s why they are in a separate folder for use between the two frameworks.

### I18n (TODO)

Name: `@jwp/ott-i18n`

We’re using i18next, which is also a framework-independent library. We can re-use the configuration and translation
files between all platforms.

### Testing

Name: `@jwp/ott-testing`

This package contains all test fixtures and could contain some generic test utils. But it shouldn’t contain
CodeceptJS/Playwright-specific code.

### Theme (TODO)

Name: `@jwp/ott-theme`

The most important theming comes from the app config, but many other SCSS variables can be abstracted into generic (
JSON) tokens. These tokens can be used across multiple frameworks.

Raw SVG icons are added here as well.

The theme folder also contains generic assets like images, logos, and fonts.

### UI-react

Name: `@jwp/ott-ui-react`

The ui-react package contains all the existing React UI code.
The ui-react package also contains the SCSS variables and theme for use across more platforms.

### Platforms/web

Name: `@jwp/ott-web`

The web folder is located in the platforms directory in the project's root folder. A platform is the entry point for
platform-specific code. In the case of the web platform, this is all the Vite.js configuration and App.tsx for
bootstrapping the app.

We can add more platforms by adding a folder to the platforms folder.

Each platform is a standalone application that may use other packages defined in the packages folder as dependency.

### Configs

The configs directory contains packages that are used mainly for configuring common build tools. This ensures these
configurations are aligned between the different application packages in the `packages/*` and `platforms/*` folder.

Since most application packages depend on ESLint and use the same configuration, the recommended way of doing this in a
monorepo is by creating a local package of the eslint config.

**eslint-config-jwp**

This is the ESLint config for React or TypeScript packages. Usage:

**.eslintrc.js**

```js
module.exports = {
  extends: ['jwp/typescript'], // extends: ['jwp/react'], 
};
```

**postcss-config-jwp**

This package contains the PostCSS config. It's not much, but it will ensure the config stays the same for all packages.

**postcss.config.js**

```js
module.exports = require('postcss-config-jwp');
```

**stylelint-config-jwp**

This package contains all Stylelint rules.

**stylelint.config.js**

```js
module.exports = {
  extends: ['stylelint-config-jwp'],
};
```

## Tips when working with workspaces

### Setup

You can set up the OTT Web App repository by following
the [Building from source](./build-from-source.md#build-the-jw-ott-webapp) documentation.

All packages are automatically linked and can be used from source. This prevents us from needing to compile each
package while developing.

### Developing

While developing the web platform, you want to cd to the `platforms/web` directory first.

```shell
cd platforms/web
```

This directory contains most of the "old" scripts that were available in the package.json.

### Dependency validation

Because there are multiple package.json files, you can use [syncpack](https://www.npmjs.com/package/syncpack) to lint
and align the dependencies. This package is not a dependency, but can be used with the NPX from the root directory.

Lint package.json files based on the syncpack config.

```shell
npx syncpack lint
```

Organize package.json files automatically based on the syncpack config.

```shell
npx syncpack format
```

### TypeScript config

Because most of the packages use TypeScript a [tsconfig.base.json](../tsconfig.base.json) file is found in the root.
Most packages extend this tsconfig file and make the changes accordingly for the package.

For example, the [tsconfig](../packages/common/tsconfig.json) in the common package overrides the `compilerOptions#lib`
property to disallow browser globals.

Another example is the [tsconfig](../packages/ui-react/tsconfig.json) in the ui-react package which extends Vite typings
and ensures SCSS modules are typed as well.  



