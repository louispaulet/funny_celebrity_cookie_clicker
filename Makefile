PORT ?= 5173
HOST ?= 0.0.0.0
PID_FILE ?= .vite.pid
LOG_FILE ?= .vite.log

.PHONY: up down deploy test

up:
	@if [ -f "$(PID_FILE)" ] && kill -0 "$$(cat $(PID_FILE))" 2>/dev/null; then \
		echo "Vite is already running at http://localhost:$(PORT)"; \
	else \
		rm -f "$(PID_FILE)"; \
		npm install; \
		nohup npm run dev -- --host $(HOST) --port $(PORT) > "$(LOG_FILE)" 2>&1 & \
		echo $$! > "$(PID_FILE)"; \
		echo "Vite started at http://localhost:$(PORT)"; \
	fi

down:
	@if [ -f "$(PID_FILE)" ]; then \
		kill "$$(cat $(PID_FILE))" 2>/dev/null || true; \
		rm -f "$(PID_FILE)"; \
		echo "Vite stopped."; \
	else \
		echo "No Vite pid file found."; \
	fi

deploy:
	npm run deploy

test:
	npm test
