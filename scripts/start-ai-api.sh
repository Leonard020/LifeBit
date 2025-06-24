#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR/apps/ai-api-fastapi"
source venv/bin/activate
uvicorn main:app --reload --port 8001 