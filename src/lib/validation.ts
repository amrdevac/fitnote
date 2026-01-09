import messages from "./validationMessages";
import { useValidationStore } from "@/store/validation";

type ValidationRule = string;

type ValidationSpec = Record<string, ValidationRule | { rule: ValidationRule; message?: Record<string, string> }>;

type CustomResponse = Record<string, string>;

const runRule = (
  rule: string,
  value: any,
  name: string,
  errors: string[],
  customMessage: string | undefined,
  customResponse: CustomResponse
) => {
  const [ruleName, param] = rule.split(":");
  const msgTemplate =
    customMessage || customResponse[ruleName] || messages[ruleName];
  switch (ruleName) {
    case "required":
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        errors.push(msgTemplate);
      }
      break;
    case "arrRequired":
      if (
        Array.isArray(value) && value.length === 0
      ) {
        errors.push(msgTemplate);
      }
      break;
    case "minChar":
      if (typeof value === "string" && value.length < Number(param)) {
        errors.push(msgTemplate.replace("___", param || ""));
      }
      break;
    case "maxChar":
      if (typeof value === "string" && value.length > Number(param)) {
        errors.push(msgTemplate.replace("___", param || ""));
      }
      break;
    case "numeric":
      if (value !== "" && isNaN(Number(value))) {
        errors.push(msgTemplate);
      }
      break;
    case "noSpace":
      if (/\s/.test(String(value))) {
        errors.push(msgTemplate);
      }
      break;
    case "email":
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          errors.push(msgTemplate);
        }
      }
      break;
    default:
      break;
  }
};

export const validateField = (
  name: string,
  value: any,
  rule: ValidationRule,
  customMessages: Record<string, string> = {},
  objCustomResponse: CustomResponse = {}
) => {
  const { setError, clearError } = useValidationStore.getState();
  const rules = rule.includes("|") ? rule.split("|") : [rule];
  const errors: string[] = [];
  rules.forEach((r) => {
    const ruleName = r.split(":")[0];
    runRule(r, value, name, errors, customMessages[ruleName], objCustomResponse);
  });
  if (errors.length) {
    setError(name, errors);
  } else {
    clearError(name);
  }
};

export const validateInput = (
  {
    objInput,
    validation,
    objCustomResponse = {},
  }: {
    objInput: Record<string, any>;
    validation: ValidationSpec;
    objCustomResponse?: CustomResponse;
  }
) => {
  const { reset } = useValidationStore.getState();
  reset();
  const entries = Object.entries(objInput);
  entries.forEach(([key, val]) => {
    const spec = validation[key];
    if (!spec) return;
    let rule: ValidationRule;
    let customMessages: Record<string, string> = {};
    if (typeof spec === "string") {
      rule = spec;
    } else {
      rule = spec.rule;
      customMessages = spec.message || {};
    }
    validateField(key, val, rule, customMessages, objCustomResponse);
  });
  const { errors } = useValidationStore.getState();
  if (Object.keys(errors).length) {
    throw new Error("Validation Error");
  }
};
