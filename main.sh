#!/usr/bin/env sh

deno run --v8-flags=--max-old-space-size=8000 --allow-read --allow-write --allow-net src/main.ts