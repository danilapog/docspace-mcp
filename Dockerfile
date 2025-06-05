FROM node:22.15.0-alpine3.21 AS build
WORKDIR /srv/onlyoffice-docspace
COPY app app
COPY lib lib
COPY util util
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY tsconfig.json tsconfig.json
RUN npm install --global pnpm@9.15.5 && pnpm install --frozen-lockfile && pnpm build

FROM node:22.15.0-alpine3.21
ENV NODE_ENV=production
WORKDIR /srv/onlyoffice-docspace
COPY --from=build /srv/onlyoffice-docspace-mcp/bin bin
COPY LICENSE LICENSE
ENTRYPOINT ["./bin/onlyoffice-docspace-mcp"]
