import { Hono } from "hono";
import { usersService } from "./users.service";
import { getErrorMessage } from "@/errors";
import { createUserSchema, updateUserSchema } from "./users.schema";
import { SIMULATOR_DAY_HEADER, simulatorDateHeaderSchema } from "@/lib/schemas";
import { SIMULATOR_START_DATE } from "@/lib/age";

const usersRouter = new Hono();

function getSimulatorDate(headerValue: string | undefined): string {
    if (headerValue === undefined || headerValue === "") return SIMULATOR_START_DATE;
    const result = simulatorDateHeaderSchema.safeParse(headerValue);
    return result.success ? result.data : SIMULATOR_START_DATE;
}

/** Parse form body (all values string) into typed object for create/update. */
function formToCreateBody(form: Record<string, string | undefined>): Record<string, unknown> {
    return {
        firstName: form.firstName ?? "",
        lastName: form.lastName ?? "",
        ageOverride: form.ageOverride !== undefined && form.ageOverride !== "" ? Number(form.ageOverride) : undefined,
        gender: form.gender ?? "male",
        birthPregnancyId: form.birthPregnancyId !== undefined && form.birthPregnancyId !== "" ? Number(form.birthPregnancyId) : undefined,
        isDeceased: form.isDeceased === "true" || form.isDeceased === "1",
    };
}

function formToUpdateBody(form: Record<string, string | undefined>): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    if (form.firstName !== undefined && form.firstName !== "") body.firstName = form.firstName;
    if (form.lastName !== undefined && form.lastName !== "") body.lastName = form.lastName;
    if (form.ageOverride !== undefined && form.ageOverride !== "") body.ageOverride = Number(form.ageOverride);
    if (form.gender !== undefined && form.gender !== "") body.gender = form.gender;
    if (form.birthPregnancyId !== undefined) body.birthPregnancyId = form.birthPregnancyId === "" || form.birthPregnancyId === "null" ? null : Number(form.birthPregnancyId);
    if (form.isDeceased !== undefined && form.isDeceased !== "") body.isDeceased = form.isDeceased === "true" || form.isDeceased === "1";
    return body;
}

usersRouter.get("/users", async (c) => {
    try {
        const users = await usersService.getUsers();
        return c.json(users);
    } catch (error) {
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: getErrorMessage(500) }, 500);
    }
});

usersRouter.get("/users/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const user = await usersService.getUserById(Number(id));
        return c.json(user);
    } catch (error) {
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: getErrorMessage(500) }, 500);
    }
});

usersRouter.post("/users", async (c) => {
    try {
        const form = (await c.req.parseBody()) as Record<string, string | undefined>;
        const body = formToCreateBody(form);
        const parsed = createUserSchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ error: parsed.error.message }, 400);
        }
        const simulatorDate = getSimulatorDate(c.req.header(SIMULATOR_DAY_HEADER));
        const user = await usersService.createUser({
            ...parsed.data,
            createdAt: simulatorDate,
            updatedAt: simulatorDate,
        });
        return c.json(user);
    } catch (error) {
        if (error instanceof Error) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: getErrorMessage(500) }, 500);
    }
});

usersRouter.put("/users/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const form = (await c.req.parseBody()) as Record<string, string | undefined>;
        const body = formToUpdateBody(form);
        const parsed = updateUserSchema.safeParse(body);
        if (!parsed.success) {
            return c.json({ error: parsed.error.message }, 400);
        }
        const simulatorDate = getSimulatorDate(c.req.header(SIMULATOR_DAY_HEADER));
        const user = await usersService.updateUser(Number(id), {
            ...parsed.data,
            updatedAt: simulatorDate,
        });
        return c.json(user);
    } catch (error) {
        if (error instanceof Error) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: getErrorMessage(500) }, 500);
    }
});

usersRouter.delete("/users/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const user = await usersService.deleteUser(Number(id));
        return c.json(user);
    } catch (error) {
        if (error instanceof Error) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: getErrorMessage(500) }, 500);
    }
});

usersRouter.get("/users/:id/relationships", async (c) => {
    try {
        const id = c.req.param("id");
        const relationships = await usersService.getUserRelationships(Number(id));
        return c.json(relationships);
    } catch (error) {
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: getErrorMessage(500) }, 500);
    }
});

usersRouter.get("/users/conceiving/:userId/:userId2", async (c) => {
    try {
        const userId = c.req.param("userId");
        const userId2 = c.req.param("userId2");
        const simulatorDate = getSimulatorDate(c.req.header(SIMULATOR_DAY_HEADER));
        const pregnancy = await usersService.createUserConceivingPregnancy(Number(userId), Number(userId2), simulatorDate);
        return c.json(pregnancy);
    } catch (error) {
        if (error instanceof Error) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: getErrorMessage(500) }, 500);
    }
});

usersRouter.get("/users/:id/pregnancy", async (c) => {
    try {
        const id = c.req.param("id");
        const simulatorDate = getSimulatorDate(c.req.header(SIMULATOR_DAY_HEADER));
        const pregnancy = await usersService.getUserPregnancy(Number(id), simulatorDate);
        return c.json(pregnancy);
    }
    catch (error) {
        if (error instanceof Error) {
            return c.json({ error: error.message }, 400);
        }
        return c.json({ error: getErrorMessage(500) }, 500);
    }
});

export default usersRouter;

