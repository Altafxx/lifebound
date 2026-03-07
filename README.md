# Lifebound

- **API:** Bun + Hono app in `api/`. See [api/README.md](api/README.md) for run instructions.
- **Simulator:** SimPy + UV in `simulator/`. Daily-cycle scaffold; see [simulator/README.md](simulator/README.md) for `uv sync` and `uv run python main.py`.
- **Docs:** Structure, conventions, and domain docs are in **[docs/api/](docs/api/)**. Start with [docs/api/docs.md](docs/api/docs.md) for the Cursor usage guide (project structure, path aliases, env/config, running, conventions).

## Data sources (locations seed)

References used for continents, countries, country–continent mapping, and related data in `api/db/seeders/locations.seeder.ts`:

- [Country–continent mapping (John Snow Labs / Datahub)](https://gist.github.com/stevewithington/20a69c0b6d2ff846ea5d35e5fc47f26c)
- [Countries list (zspine)](https://gist.github.com/zspine/2365808)
- [Countries / country codes (anubhavshrimal)](https://gist.github.com/anubhavshrimal/75f6183458db8c453306f93521e93d37)
- [List of telephone country codes (Wikipedia)](https://en.wikipedia.org/wiki/List_of_telephone_country_codes#Locations_without_dedicated_country_code)
- [List of ISO 3166 country codes (Wikipedia)](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes)
- [country-codes dataset (CSV)](https://github.com/datasets/country-codes/blob/main/data/country-codes.csv)
