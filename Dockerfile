FROM node:20-alpine as builder

RUN  apk add --no-cache --virtual .gyp git

WORKDIR /app

COPY package*.json /app/

RUN npm install --no-progress

COPY . .

RUN npm run build

#########################################################
#########################################################

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.output /app/.output

RUN npm install --omit=dev nuxt pino-pretty

EXPOSE 3000

CMD NITRO_HOST=0.0.0.0 node .output/server/index.mjs
