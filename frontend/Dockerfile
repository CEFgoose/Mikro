# Build environment
FROM node:latest as builder

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm install --production

COPY . /app

RUN npm run build

# Production environment
FROM nginx:latest
LABEL maintainer="taylor.smock@kaart.com"
EXPOSE 80/tcp
COPY docker_etc_files/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
