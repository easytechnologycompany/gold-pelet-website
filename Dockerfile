# Multi-stage build — compiles the tiny static-file server, then ships it
# in a minimal runtime image alongside the actual site files it serves.
FROM golang:1.25-alpine AS build
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 go build -o /out/frontend ./main.go

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/frontend ./frontend
COPY index.html about.html services.html products.html contact.html news.html ./
COPY css ./css
COPY js ./js
COPY assets ./assets
COPY admin ./admin
EXPOSE 8123
CMD ["./frontend"]
