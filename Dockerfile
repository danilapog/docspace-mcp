FROM node:24.1.0-alpine3.22 AS build
WORKDIR /srv/onlyoffice-docspace-mcp
COPY app app
COPY lib lib
COPY scripts scripts
COPY util util
COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
COPY tsconfig.json tsconfig.json
RUN \
	npm install --global pnpm@10.11.0 && \
	pnpm install --frozen-lockfile && \
	pnpm build

FROM node:24.1.0-alpine3.22
ENV NODE_ENV=production
WORKDIR /srv/onlyoffice-docspace-mcp
COPY --from=build /srv/onlyoffice-docspace-mcp/bin bin
COPY LICENSE LICENSE
ENTRYPOINT ["./bin/onlyoffice-docspace-mcp"]
