# Lifebound Simulator

SimPy-based **daily** simulation for Lifebound. Uses [UV](https://docs.astral.sh/uv/) for dependency management and an isolated virtual env (`.venv` in this directory) so it does not conflict with other Python projects.

**Prerequisites:** [UV](https://docs.astral.sh/uv/) installed.

## Commands

From the repo root or from `simulator/`:

```bash
cd simulator
uv sync
```

Creates or updates `.venv` and installs dependencies (generates `uv.lock` if missing). Commit `uv.lock` for reproducible installs.

Run the daily cycle:

```bash
cd simulator
uv run python main.py
```

Options:

- `--days N` — run for N days (default: 10). Use `--days 0` to run until interrupted.

## Current behavior

The simulation runs one **day** per SimPy time unit. Each day a placeholder tick runs (no API calls yet). API integration (e.g. `X-Simulator-Day`, HTTP to the Lifebound API) will be added later.
