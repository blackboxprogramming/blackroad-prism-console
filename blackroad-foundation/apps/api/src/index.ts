import express from "express";
import { router as health } from "./routes/health.js";
import { router as webhooks } from "./routes/webhooks.js";
const app = express();
app.use(express.json());
app.use("/health", health);
app.use("/webhooks", webhooks);
app.listen(4000, () => console.log("API listening on :4000"));
