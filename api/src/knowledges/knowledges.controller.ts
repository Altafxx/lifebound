import { Hono } from "hono";
import { knowledgesService } from "./knowledges.service";
import { getErrorMessage } from "@/errors";
import { locationsService } from "@/locations/locations.service";

const knowledgesRouter = new Hono();

knowledgesRouter.get("/knowledge", async (c) => {
  try {
    const category = c.req.query("category") ?? undefined;
    const knowledges = await knowledgesService.getKnowledges(
      category ? { category } : undefined
    );
    return c.json(knowledges);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

knowledgesRouter.get("/knowledge/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid knowledge id" }, 400);
    }
    const knowledge = await knowledgesService.getKnowledgeById(id);
    if (!knowledge) {
      return c.json({ error: "Knowledge not found" }, 404);
    }
    return c.json(knowledge);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

knowledgesRouter.get("/knowledge/:id/countries", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid knowledge id" }, 400);
    }
    const knowledge = await knowledgesService.getKnowledgeById(id);
    if (!knowledge) {
      return c.json({ error: "Knowledge not found" }, 404);
    }
    const countries = await knowledgesService.getCountriesByKnowledgeId(id);
    return c.json(countries);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

knowledgesRouter.get("/countries/:id/knowledge", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid country id" }, 400);
    }
    const country = await locationsService.getCountryById(id);
    if (!country) {
      return c.json({ error: "Country not found" }, 404);
    }
    const knowledges = await knowledgesService.getKnowledgesByCountryId(id);
    return c.json(knowledges);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

export default knowledgesRouter;
