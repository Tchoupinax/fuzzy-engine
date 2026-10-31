FROM node:26.12.1-alpine AS builder

RUN  apk add --no-cache --virtual .gyp git

WORKDIR /app

COPY package*.json /app/

RUN yarn

COPY . .

RUN npm run build

#########################################################
#########################################################

FROM node:26.12.1-alpine

WORKDIR /app

COPY --from=builder /app/.output /app/.output

RUN yarn --production && yarn add nuxt pino-pretty

EXPOSE 3000

CMD NITRO_HOST=0.0.0.0 node .output/server/index.mjs
