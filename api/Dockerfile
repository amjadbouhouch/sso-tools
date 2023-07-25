FROM python:3.9-slim-buster

# set work directory
WORKDIR /app

# install poetry
RUN pip install poetry

# install dependencies
COPY pyproject.toml .
COPY poetry.lock .
RUN poetry export -f requirements.txt | pip install -r /dev/stdin

# add app files
COPY app.py .
COPY chalicelib ./chalicelib

CMD ["gunicorn"  , "-b", "0.0.0.0:8000", "app:app"]
