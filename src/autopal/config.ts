import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "./config.schema.json";

export type AutoPalConfig = any;

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema as any);

export class Config extends EventEmitter {
  private file: string;
  private current: AutoPalConfig;

  constructor(file = path.resolve(process.env.AUTOPAL_CONFIG ?? "autopal.config.json")) {
    super();
    this.file = file;
    this.current = this.loadOrDie();
    this.watch();
  }

  get value(): AutoPalConfig {
    return this.current;
  }

  private loadOrDie(): AutoPalConfig {
    const raw = fs.readFileSync(this.file, "utf8");
    const parsed = JSON.parse(raw);
    if (!validate(parsed)) {
      const msg = (validate.errors ?? [])
        .map((e) => `${e.instancePath} ${e.message}`)
        .join("; ");
      throw new Error("Config validation failed: " + msg);
    }
    return parsed;
  }

  private watch() {
    fs.watchFile(this.file, { interval: 1000 }, () => {
      try {
        const next = this.loadOrDie();
        this.current = next;
        this.emit("reload", next);
        console.log("[config] reloaded");
      } catch (e) {
        console.error(
          "[config] reload failed, keeping previous:",
          (e as Error).message
        );
      }
    });
  }
}
