FROM node:16-alpine as builder

RUN  apk add --no-cache --virtual .gyp git

WORKDIR /app

COPY package*.json /app/

RUN npm install --no-progress

COPY . .

RUN npx nuxt build --standalone -m

#########################################################
#########################################################

FROM node:16-alpine

RUN  apk add --no-cache --virtual .gyp git

WORKDIR /app

COPY --from=builder /app/.nuxt /app/.nuxt/

RUN npm install --production nuxt && npx modclean -r

EXPOSE 3000

CMD NUXT_HOST=0.0.0.0 npx nuxt start
