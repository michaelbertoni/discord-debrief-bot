FROM node:18 as builder

COPY package.json .
RUN npm install

FROM gcr.io/distroless/nodejs18-debian11 as release

COPY --from=builder node_modules /app/node_modules
COPY index.js /app

WORKDIR /app

ENV BOT_TOKEN=
ENV BOT_APPLICATION_ID=
ENV GUILD_ID=

CMD ["index.js"]