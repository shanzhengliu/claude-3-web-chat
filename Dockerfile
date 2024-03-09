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
COPY ./backend-go/ .
COPY --from=NodeBuild /app/dist/ ./ui/
RUN go mod download
RUN go build -o /app/main .
# go build end

# final image
FROM alpine:latest
WORKDIR /app
COPY --from=GoBuild app/ app/
EXPOSE 8080
ENTRYPOINT [ "app/main" ]