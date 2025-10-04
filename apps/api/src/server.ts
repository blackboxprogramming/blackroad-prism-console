import express from "express";
import helmet from "helmet";
import cors from "cors";
import classifyRouter from "./routes/classify.js";
import exceptionsRouter from "./routes/exceptions.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  express.urlencoded({
    extended: false,
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString();
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/", classifyRouter);
app.use("/", exceptionsRouter);

const port = Number(process.env.PORT ?? 4000);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Lucidia Auto-Box API listening on port ${port}`);
  });
}

export default app;
