import { config } from "@/config";
import { Hono } from "hono";
import usersRouter from "./users/users.controller";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.route("/", usersRouter);

export default app;

// Start the server
Bun.serve({
	fetch: app.fetch,
	port: config.port,
});

console.log(`Server running on http://localhost:${config.port}`);
