#!/bin/bash

set -uo pipefail

# 获取脚本所在目录（.zscripts）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log_step_start() {
        local step_name="$1"
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting: $step_name"
        echo "=========================================="
        export STEP_START_TIME
        STEP_START_TIME=$(date +%s)
}

log_step_end() {
        local step_name="${1:-Unknown step}"
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - STEP_START_TIME))
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Completed: $step_name"
        echo "[LOG] Step: $step_name | Duration: ${duration}s"
        echo "=========================================="
        echo ""
}

start_mini_services() {
        local mini_services_dir="$PROJECT_DIR/mini-services"
        local started_count=0

        log_step_start "Starting mini-services"
        if [ ! -d "$mini_services_dir" ]; then
                echo "Mini-services directory not found, skipping..."
                log_step_end "Starting mini-services"
                return 0
        fi

        echo "Found mini-services directory, scanning for sub-services..."

        for service_dir in "$mini_services_dir"/*; do
                if [ ! -d "$service_dir" ]; then
                        continue
                fi

                local service_name
                service_name=$(basename "$service_dir")
                echo "Checking service: $service_name"

                if [ ! -f "$service_dir/package.json" ]; then
                        echo "[$service_name] No package.json found, skipping..."
                        continue
                fi

                if ! grep -q '"dev"' "$service_dir/package.json"; then
                        echo "[$service_name] No dev script found, skipping..."
                        continue
                fi

                echo "Starting $service_name in background..."
                (
                        cd "$service_dir"
                        echo "[$service_name] Installing dependencies..."
                        bun install
                        echo "[$service_name] Running bun run dev..."
                        exec bun run dev
                ) >"$PROJECT_DIR/.zscripts/mini-service-${service_name}.log" 2>&1 &

                local service_pid=$!
                echo "[$service_name] Started in background (PID: $service_pid)"
                echo "[$service_name] Log: $PROJECT_DIR/.zscripts/mini-service-${service_name}.log"
                disown "$service_pid" 2>/dev/null || true
                started_count=$((started_count + 1))
        done

        echo "Mini-services startup completed. Started $started_count service(s)."
        log_step_end "Starting mini-services"
}

wait_for_service() {
        local host="$1"
        local port="$2"
        local service_name="$3"
        local max_attempts="${4:-60}"
        local attempt=1

        echo "Waiting for $service_name to be ready on $host:$port..."

        while [ "$attempt" -le "$max_attempts" ]; do
                if curl -s --connect-timeout 2 --max-time 5 "http://$host:$port" >/dev/null 2>&1; then
                        echo "$service_name is ready!"
                        return 0
                fi

                echo "Attempt $attempt/$max_attempts: $service_name not ready yet, waiting..."
                sleep 1
                attempt=$((attempt + 1))
        done

        echo "ERROR: $service_name failed to start within $max_attempts seconds"
        return 1
}

cd "$PROJECT_DIR"

if ! command -v bun >/dev/null 2>&1; then
        echo "ERROR: bun is not installed or not in PATH"
        exit 1
fi

log_step_start "bun install"
echo "[BUN] Installing dependencies..."
bun install
log_step_end "bun install"

log_step_start "bun run db:push"
echo "[BUN] Setting up database..."
bun run db:push
log_step_end "bun run db:push"

# Build production version for lower memory usage
log_step_start "Building production version"
echo "[BUILD] Creating optimized production build..."
node node_modules/.bin/next build
log_step_end "Building production version"

# Copy static files for standalone server
if [ -d ".next/standalone" ]; then
        cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
        cp -r public .next/standalone/ 2>/dev/null || true
        echo "[BUILD] Standalone files prepared"
fi

start_mini_services

# Start production server with auto-restart loop
log_step_start "Starting Next.js server (production with auto-restart)"
echo "[SERVER] Starting production server with auto-restart..."

# Write PID file for management
echo $$ > /tmp/next-server-daemon.pid

RESTART_COUNT=0
LAST_RESTART=0

while true; do
        NOW=$(date +%s)
        
        # Throttle restarts
        if [ $((NOW - LAST_RESTART)) -lt 10 ]; then
                RESTART_COUNT=$((RESTART_COUNT + 1))
        else
                RESTART_COUNT=0
        fi
        LAST_RESTART=$NOW
        
        # Determine delay before restart
        if [ $RESTART_COUNT -gt 5 ]; then
                DELAY=30
        elif [ $RESTART_COUNT -gt 3 ]; then
                DELAY=15
        elif [ $RESTART_COUNT -gt 1 ]; then
                DELAY=5
        else
                DELAY=2
        fi
        
        # Clean stale lock
        rm -f .next/lock 2>/dev/null
        
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Next.js server (attempt $((RESTART_COUNT+1)))..."
        
        DATABASE_URL="file:$PROJECT_DIR/db/custom.db" \
        PORT=3000 \
        HOSTNAME=0.0.0.0 \
        NODE_ENV=production \
        node .next/standalone/server.js
        
        EXIT_CODE=$?
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Server exited with code $EXIT_CODE"
        
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting in ${DELAY}s..."
        sleep $DELAY
done &

SERVER_PID=$!
echo "Server daemon PID: $SERVER_PID"
disown $SERVER_PID 2>/dev/null || true

# Wait for server to be ready
wait_for_service "localhost" "3000" "Next.js server"

log_step_start "Health check"
echo "[SERVER] Performing health check..."
curl -fsS localhost:3000 >/dev/null
echo "[SERVER] Health check passed"
log_step_end "Health check"

echo "Next.js production server is running with auto-restart."
