import { Hono } from "hono";
import { getErrorMessage } from "@/errors";
import { SIMULATOR_DAY_HEADER, getSimulatorDate } from "@/lib/schemas";
import * as actionsService from "./actions.service";
import { mateActionSchema, eatDrinkAmountSchema, tickBatchSchema } from "./actions.schema";

const actionsRouter = new Hono();

actionsRouter.post("/users/:id/actions/gather", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid user id" }, 400);
    const result = await actionsService.gather(id);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

actionsRouter.post("/users/:id/actions/scavenge-water", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid user id" }, 400);
    const result = await actionsService.scavengeWater(id);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

actionsRouter.post("/users/:id/actions/eat", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid user id" }, 400);
    const body = await c.req.json().catch(() => ({}));
    const parsed = eatDrinkAmountSchema.safeParse(body);
    const amount = parsed.success ? parsed.data.amount : 1;
    const result = await actionsService.eat(id, amount);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

actionsRouter.post("/users/:id/actions/drink", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid user id" }, 400);
    const body = await c.req.json().catch(() => ({}));
    const parsed = eatDrinkAmountSchema.safeParse(body);
    const amount = parsed.success ? parsed.data.amount : 1;
    const result = await actionsService.drink(id, amount);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

actionsRouter.post("/users/:id/actions/mate", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid user id" }, 400);
    const body = await c.req.json();
    const parsed = mateActionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.message }, 400);
    const simulatorDate = getSimulatorDate(c.req.header(SIMULATOR_DAY_HEADER));
    const result = await actionsService.mate(id, parsed.data.partnerId, simulatorDate);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

actionsRouter.post("/users/:id/stats/tick", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid user id" }, 400);
    const result = await actionsService.tickUserStats(id);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 404);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

actionsRouter.post("/user-stats/tick", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const parsed = tickBatchSchema.safeParse(body);
    const userIds = parsed.success && parsed.data.userIds?.length
      ? parsed.data.userIds
      : [];
    if (userIds.length === 0) {
      return c.json({ error: "userIds array required and must not be empty" }, 400);
    }
    const results = await actionsService.tickUserStatsBatch(userIds);
    return c.json({ results });
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: getErrorMessage(500) }, 500);
  }
});

export default actionsRouter;
