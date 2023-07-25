# SSO Tools IDP Service

This directory contains the source code for the IDP service. This service is responsible for negotiating the SSO process.

## Preparing a local environment

Firstly, install dependencies:

```shell
yarn
```

## Running the service locally

Firstly, source the environment file:

```shell
source envfile
```

Then you can run the service:

```shell
node index
```

**Note:** The service expects to be able to connect to a local MongoDB running on port 27017.

Once running, the service is available via a web browser on port 6001.