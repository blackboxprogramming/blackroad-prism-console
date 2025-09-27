import express from "express";
import helmet from "helmet";
import cors from "cors";
import classifyRouter from "./routes/classify.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/", classifyRouter);

const port = Number(process.env.PORT ?? 4000);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Lucidia Auto-Box API listening on port ${port}`);
  });
}

export default app;
