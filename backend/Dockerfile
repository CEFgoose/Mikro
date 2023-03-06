FROM python:latest
LABEL maintainer="taylor.smock@kaart.com"
EXPOSE 8000/tcp

RUN apt-get update && apt-get install -y --no-install-recommends libgeos-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir gunicorn && pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

CMD ["./start.sh"]
