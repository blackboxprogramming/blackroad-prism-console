#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const schemaDir = path.join(__dirname, "../schemas");
const ajv = new Ajv({
  strict: false,
  validateSchema: true,
  allowUnionTypes: true,
  allErrors: true,
});
addFormats(ajv);

const files = fs
  .readdirSync(schemaDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

const schemas = files.map((file) => {
  const fullPath = path.join(schemaDir, file);
  const raw = fs.readFileSync(fullPath, "utf8");
  const schema = JSON.parse(raw);
  ajv.addSchema(schema, schema.$id || file);
  return { file, schema };
});

let hasErrors = false;

for (const { file, schema } of schemas) {
  try {
    ajv.compile(schema);
    console.log(`✅  ${file}`);
  } catch (error) {
    hasErrors = true;
    console.error(`❌  ${file}`);
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
}

if (hasErrors) {
  process.exit(1);
}
