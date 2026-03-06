import { Hono } from "hono";
import { erasService } from "./eras.service";
import { getErrorMessage } from "@/errors";
import { locationsService } from "@/locations/locations.service";

const erasRouter = new Hono();

erasRouter.get("/eras", async (c) => {
  try {
    const eras = await erasService.getEras();
    return c.json(eras);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

erasRouter.get("/eras/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid era id" }, 400);
    }
    const era = await erasService.getEraById(id);
    if (!era) {
      return c.json({ error: "Era not found" }, 404);
    }
    return c.json(era);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

erasRouter.get("/eras/:id/countries", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid era id" }, 400);
    }
    const era = await erasService.getEraById(id);
    if (!era) {
      return c.json({ error: "Era not found" }, 404);
    }
    const countries = await erasService.getCountriesByEraId(id);
    return c.json(countries);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

erasRouter.get("/countries/:id/era", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid country id" }, 400);
    }
    const country = await locationsService.getCountryById(id);
    if (!country) {
      return c.json({ error: "Country not found" }, 404);
    }
    const currentEra = await erasService.getCountryCurrentEra(id);
    return c.json({ currentEra });
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

export default erasRouter;
