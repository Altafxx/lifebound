import { Hono } from "hono";
import { locationsService } from "./locations.service";
import { getErrorMessage } from "@/errors";

const locationsRouter = new Hono();

locationsRouter.get("/continents", async (c) => {
  try {
    const continents = await locationsService.getContinents();
    return c.json(continents);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

locationsRouter.get("/countries", async (c) => {
  try {
    const continentIdParam = c.req.query("continentId");
    const continentId =
      continentIdParam !== undefined && continentIdParam !== ""
        ? Number(continentIdParam)
        : undefined;
    if (continentId !== undefined && Number.isNaN(continentId)) {
      return c.json({ error: "continentId must be a number" }, 400);
    }
    const countries = await locationsService.getCountries({ continentId });
    return c.json(countries);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

locationsRouter.get("/countries/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid country id" }, 400);
    }
    const country = await locationsService.getCountryById(id);
    if (!country) {
      return c.json({ error: "Country not found" }, 404);
    }
    return c.json(country);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

locationsRouter.get("/countries/:id/states", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid country id" }, 400);
    }
    const country = await locationsService.getCountryById(id);
    if (!country) {
      return c.json({ error: "Country not found" }, 404);
    }
    const states = await locationsService.getStatesByCountryId(id);
    return c.json(states);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

locationsRouter.get("/states", async (c) => {
  try {
    const countryIdParam = c.req.query("countryId");
    const countryId =
      countryIdParam !== undefined && countryIdParam !== ""
        ? Number(countryIdParam)
        : undefined;
    if (countryId !== undefined && Number.isNaN(countryId)) {
      return c.json({ error: "countryId must be a number" }, 400);
    }
    const states = await locationsService.getStates({ countryId });
    return c.json(states);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

locationsRouter.get("/states/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return c.json({ error: "Invalid state id" }, 400);
    }
    const withStats = c.req.query("withStats") === "true";
    const state = withStats
      ? await locationsService.getStateByIdWithStats(numericId)
      : await locationsService.getStateById(numericId);
    if (!state) {
      return c.json({ error: "State not found" }, 404);
    }
    return c.json(state);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

locationsRouter.post("/states/:id/stats/regen", async (c) => {
  try {
    const id = c.req.param("id");
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return c.json({ error: "Invalid state id" }, 400);
    }
    const updated = await locationsService.regenStateStats(numericId);
    if (!updated) {
      return c.json({ error: "State or state stats not found" }, 404);
    }
    return c.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

export default locationsRouter;
