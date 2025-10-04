import express from "express";
import helmet from "helmet";
import cors from "cors";
import classifyRouter from "./routes/classify.js";
import metricsRouter from "./routes/metrics.js";
import hooksRouter from "./routes/hooks.js";
import createSourcesRouter from "./routes/sources.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "1mb",
    verify: (req: any, _res, buf) => {
      (req as any).rawBody = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/v1/metrics", metricsRouter);
app.use("/api/prism/metrics", metricsRouter);
app.use("/webhooks", hooksRouter);
app.use("/v1/sources", createSourcesRouter());
app.use("/api/prism/sources", createSourcesRouter());
app.use("/", classifyRouter);

const port = Number(process.env.PORT ?? 4000);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Lucidia Auto-Box API listening on port ${port}`);
  });
}

export default app;
