FROM python:3.8
LABEL maintainer="taylor.smock@kaart.com"
EXPOSE 8000/tcp

RUN apt-get update && apt-get install -y --no-install-recommends libgeos-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir gunicorn && pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

ENV GC_API_CONFIG="/app/devops-configs/config.py"
ENV FLASK_APP="/app/autoapp.py"


CMD ["./start.sh"]
