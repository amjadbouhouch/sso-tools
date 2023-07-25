# SSO Tools Web API

This directory contains the source code for the primary API for the SSO Tools webapp. This service provides the endpoints required for managing IdPs.

## Preparing a local environment

Firstly, create and enter a virtual environment:

```shell
virtualenv -p python3 .venv # You only need this the first time
source .venv/bin/activate
```

Install dependencies (you may need to install [Poetry](https://python-poetry.org) first):

```shell
poetry install
```

## Running the API service locally

Firstly, source the environment file:

```shell
source envfile
```

Then you can run the service:

```shell
flask run
```

**Note:** The service expects to be able to connect to a local MongoDB running on port 27017.

Once running, the service is available on port 6002.