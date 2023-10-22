export GOMODPROXY=direct

.PHONY: serve
serve:
	go run github.com/eliben/static-server@latest -addr :8000

