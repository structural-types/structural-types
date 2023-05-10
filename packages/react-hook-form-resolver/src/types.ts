import { FieldValues, ResolverResult, ResolverOptions } from "react-hook-form";
import { Schema } from "@structural-types/schema";

export type Resolver = <TFieldValues extends FieldValues, TContext>(
  schema: Schema<TFieldValues>,
  schemaOptions?: never,
  factoryOptions?: {
    /**
     * Return the raw input values rather than the parsed values.
     * @default false
     */
    raw?: boolean;
  }
) => (
  values: TFieldValues,
  context: TContext | undefined,
  options: ResolverOptions<TFieldValues>
) => ResolverResult<TFieldValues>;
