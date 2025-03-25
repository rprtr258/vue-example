#!/usr/bin/bash

serve() {
    go run github.com/eliben/static-server@latest
}
dev() {
    watch -n0 'bun build --production main.ts > main.js'
}