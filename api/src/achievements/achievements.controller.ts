import { Hono } from "hono";
import { achievementsService } from "./achievements.service";
import { getErrorMessage } from "@/errors";

const achievementsRouter = new Hono();

achievementsRouter.get("/achievements", async (c) => {
  try {
    const achievements = await achievementsService.getAchievements();
    return c.json(achievements);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

achievementsRouter.get("/achievements/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid achievement id" }, 400);
    }
    const achievement = await achievementsService.getAchievementById(id);
    if (!achievement) {
      return c.json({ error: "Achievement not found" }, 404);
    }
    return c.json(achievement);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

achievementsRouter.get("/achievements/:id/countries", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid achievement id" }, 400);
    }
    const achievement = await achievementsService.getAchievementById(id);
    if (!achievement) {
      return c.json({ error: "Achievement not found" }, 404);
    }
    const countries = await achievementsService.getCountriesByAchievementId(id);
    return c.json(countries);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

export default achievementsRouter;
