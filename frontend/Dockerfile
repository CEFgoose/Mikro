# Build environment
FROM node:16 as builder

ENV NODE_OPTIONS=--max_old_space_size=4096

WORKDIR /app

COPY viewer/package.json /app

RUN npm install --force

COPY viewer/ /app

RUN npm run build

# Production environment
FROM nginx:latest
LABEL maintainer="taylor.smock@kaart.com"
EXPOSE 80/tcp
COPY docker_etc_files/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
