# node build start
FROM node:20-slim AS NodeBuild
WORKDIR /app
COPY ./frontend-react/ /app
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build
# node build end

# go build start
FROM golang:1.20.6-alpine3.18 AS GoBuild
WORKDIR /app
RUN apk add --no-cache upx
COPY ./backend-go/ .
COPY --from=NodeBuild /app/dist/ ./ui/
RUN go mod download
RUN go build -ldflags="-s -w" -o /app/main .
RUN upx --brute /app/main
# go build end

# final image
FROM gcr.io/distroless/static
WORKDIR /app
COPY --from=GoBuild app/ app/
EXPOSE 8080
ENTRYPOINT [ "app/main" ]