#!/bin/sh
set -e

: "${VITE_WATCH_STRATEGY:=events}"
: "${VITE_WATCH_POLL_INTERVAL:=300}"

if [ "$VITE_WATCH_STRATEGY" = "polling" ]; then
  export CHOKIDAR_USEPOLLING=true
  export CHOKIDAR_INTERVAL="$VITE_WATCH_POLL_INTERVAL"
else
  export CHOKIDAR_USEPOLLING=false
fi

npm run dev -- --host --mode dev
