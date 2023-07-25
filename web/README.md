# SSO Tools Webapp

This directory contains the source code for the webapp front-end to the SSO Tools platform.

## Preparing a local environment

After cloning the repository, install dependencies locally:

```shell
yarn
```

## Running the front-end locally

The front-end can then be run using:

```shell
yarn start
```

Once running, the webapp will be available on port 3300.

**Note:** This webapp expects to be able to connect to a local API running on port 6002.

## Build for production

Build the web assets:

```shell
yarn build
```

Then simply upload the contents of the `dist/` directory to your webserver or host of choice.