import { Hono } from "hono";
import { skillsService } from "./skills.service";
import { getErrorMessage } from "@/errors";
import { locationsService } from "@/locations/locations.service";
import { usersService } from "@/users/users.service";

const skillsRouter = new Hono();

skillsRouter.get("/skills", async (c) => {
  try {
    const category = c.req.query("category") ?? undefined;
    const skills = await skillsService.getSkills(
      category ? { category } : undefined
    );
    return c.json(skills);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

skillsRouter.get("/skills/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid skill id" }, 400);
    }
    const withKnowledge = c.req.query("withKnowledge") === "true";
    const skill = withKnowledge
      ? await skillsService.getSkillWithKnowledge(id)
      : await skillsService.getSkillById(id);
    if (!skill) {
      return c.json({ error: "Skill not found" }, 404);
    }
    return c.json(skill);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

skillsRouter.get("/skills/:id/users", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid skill id" }, 400);
    }
    const skill = await skillsService.getSkillById(id);
    if (!skill) {
      return c.json({ error: "Skill not found" }, 404);
    }
    const users = await skillsService.getUsersBySkillId(id);
    return c.json(users);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

skillsRouter.get("/users/:id/skills", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid user id" }, 400);
    }
    const user = await usersService.getUserById(id);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    const skills = await skillsService.getSkillsByUserId(id);
    return c.json(skills);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

skillsRouter.get("/countries/:id/skills", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid country id" }, 400);
    }
    const country = await locationsService.getCountryById(id);
    if (!country) {
      return c.json({ error: "Country not found" }, 404);
    }
    const countrySkills = await skillsService.getCountrySkills(id);
    return c.json(countrySkills);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

export default skillsRouter;
