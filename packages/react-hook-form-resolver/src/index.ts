import { FieldError, appendErrors } from "react-hook-form";
import { toNestError, validateFieldsNatively } from "@hookform/resolvers";
import type { Resolver } from "./types";
import type { SchemaError } from "@structural-types/schema";

const parseErrorSchema = (
  error: SchemaError,
  validateAllFieldCriteria: boolean
) => {
  return [error].reduce<Record<string, FieldError>>((previous, error) => {
    const _path = error.context.path.join(".");
    if (!previous[_path]) {
      previous[_path] = { message: error.message, type: error.context.type };
    }

    if (validateAllFieldCriteria) {
      const types = previous[_path].types;
      const messages = types && types[error.context.type];

      previous[_path] = appendErrors(
        _path,
        validateAllFieldCriteria,
        previous,
        error.context.type,
        messages
          ? ([] as string[]).concat(messages as string[], error.message)
          : error.message
      ) as FieldError;
    }

    return previous;
  }, {});
};
export const resolver: Resolver =
  (schema, schemaOptions, resolverOptions = {}) =>
  (values, context, options) => {
    const result = schema.parseResult(values);

    if (result.isErr()) {
      return {
        values: {},
        errors: toNestError(
          parseErrorSchema(
            result.unwrapErr(),
            !options.shouldUseNativeValidation && options.criteriaMode === "all"
          ),
          options
        ),
      };
    }

    options.shouldUseNativeValidation && validateFieldsNatively({}, options);

    return {
      errors: {},
      values: resolverOptions.raw ? values : result.unwrap(),
    };
  };
