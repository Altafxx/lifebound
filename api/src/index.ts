import { config } from "@/config";
import { Hono } from "hono";
import usersRouter from "./users/users.controller";
import locationsRouter from "./locations/locations.controller";
import achievementsRouter from "./achievements/achievements.controller";
import erasRouter from "./eras/eras.controller";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.route("/", usersRouter);
app.route("/", locationsRouter);
app.route("/", achievementsRouter);
app.route("/", erasRouter);

export default app;

// Start the server
Bun.serve({
	fetch: app.fetch,
	port: config.port,
});

console.log(`Server running on http://localhost:${config.port}`);
