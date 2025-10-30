import Ajv, { ErrorObject, ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";

import agentRequestSchema from "../schemas/agent-request.schema.json";
import agentResponseSchema from "../schemas/agent-response.schema.json";
import toolSchema from "../schemas/tool.schema.json";
import {
  AgentRequest,
  AgentResponse,
  ToolDefinition,
  ValidationResult,
} from "./types";

const ajv = new Ajv({
  strict: false,
  allErrors: true,
  allowUnionTypes: true,
  validateSchema: true,
});

addFormats(ajv);

ajv.addSchema(toolSchema as unknown, toolSchema.$id);

const toolValidator = ajv.compile<ToolDefinition>(toolSchema as unknown);
const agentRequestValidator = ajv.compile<AgentRequest>(agentRequestSchema as unknown);
const agentResponseValidator = ajv.compile<AgentResponse>(agentResponseSchema as unknown);

type Validator<T> = ValidateFunction<T>;

function normalizeErrors(errors: ErrorObject[] | null | undefined): string[] | undefined {
  if (!errors || errors.length === 0) {
    return undefined;
  }

  return errors.map((error) => {
    const instancePath = error.instancePath || "/";
    const message = error.message ?? "Validation error";
    const params = Object.entries(error.params || {})
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(", ");
    return params ? `${instancePath} ${message} (${params})` : `${instancePath} ${message}`;
  });
}

function runValidation<T>(validator: Validator<T>, payload: unknown): ValidationResult<T> {
  const valid = validator(payload);
  if (valid) {
    return {
      valid: true,
      data: payload as T,
    };
  }

  return {
    valid: false,
    errors: normalizeErrors(validator.errors),
  };
}

export function validateToolDefinition(payload: unknown): ValidationResult<ToolDefinition> {
  return runValidation(toolValidator, payload);
}

export function validateAgentRequest(payload: unknown): ValidationResult<AgentRequest> {
  return runValidation(agentRequestValidator as Validator<AgentRequest>, payload);
}

export function validateAgentResponse(payload: unknown): ValidationResult<AgentResponse> {
  return runValidation(agentResponseValidator as Validator<AgentResponse>, payload);
}

export function assertValid<T>(
  validator: (payload: unknown) => ValidationResult<T>,
  payload: unknown,
): T {
  const result = validator(payload);
  if (!result.valid) {
    const message = result.errors?.join("; ") ?? "Unknown schema validation failure";
    throw new Error(message);
  }
  return result.data as T;
}

export function formatErrors(errors: ErrorObject[] | null | undefined): string[] | undefined {
  return normalizeErrors(errors);
}
