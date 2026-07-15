#!/usr/bin/env bash
# Start MineGlobe API (yfinance quotes + EDGAR + LLM proxy) on :8000
set -euo pipefail
cd "$(dirname "$0")"

pick_python() {
  if [[ -x .venv/bin/python ]]; then
    ver="$(.venv/bin/python -c 'import sys; print(f"{sys.version_info[0]}.{sys.version_info[1]}")' 2>/dev/null || echo 0)"
    major="${ver%%.*}"
    minor="${ver#*.}"
    if [[ "$major" -gt 3 ]] || { [[ "$major" -eq 3 ]] && [[ "$minor" -ge 10 ]]; }; then
      echo .venv/bin/python
      return
    fi
  fi
  # Prefer PYTHON env, then common public interpreters (no machine-specific paths)
  for cand in \
    "${PYTHON:-}" \
    python3.13 \
    python3.12 \
    python3.11 \
    python3.10 \
    python3
  do
    [[ -z "$cand" ]] && continue
    if command -v "$cand" >/dev/null 2>&1 || [[ -x "$cand" ]]; then
      if "$cand" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
        echo "$cand"
        return
      fi
    fi
  done
  echo "Need Python 3.10+ for yfinance. Set PYTHON=/path/to/python3.11 or install python3.11+." >&2
  exit 1
}

PY="$(pick_python)"
if [[ ! -x .venv/bin/python ]] || ! .venv/bin/python -c 'import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
  echo "Creating venv with $PY …"
  rm -rf .venv
  "$PY" -m venv .venv
fi

.venv/bin/pip install -q -r requirements.txt
echo "Starting MineGlobe API on http://127.0.0.1:8000"
exec .venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
