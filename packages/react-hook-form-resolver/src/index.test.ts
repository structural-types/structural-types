import { it, expect, describe } from "vitest";
import { resolver } from ".";
import { ObjectSchema, StringSchema } from "@structural-types/schema";

describe("resolver", () => {
  it("should return empty object when no validation rules are provided", () => {
    const schema = new ObjectSchema({});
    const subject = resolver(schema);
    expect(
      subject({}, undefined, {
        names: [],
        fields: {},
        shouldUseNativeValidation: undefined,
      })
    ).toEqual({ errors: {}, values: {} });
  });

  it("should return validation rules for each field", () => {
    const schema = new ObjectSchema({
      name: new StringSchema({ minLength: 3, maxLength: 10, required: true }),
    });
    const subject = resolver(schema);
    const nameInput = document.createElement("input");
    nameInput.name = "name";
    expect(
      subject(
        {
          name: "John",
        },
        undefined,
        {
          fields: {
            name: {
              ref: nameInput,
              name: "name",
              mount: true,
              required: "Required",
            },
          },
          names: ["name"],
          shouldUseNativeValidation: undefined,
        }
      )
    ).toEqual({
      errors: {},
      values: {
        name: "John",
      },
    });

    expect(
      subject({ name: "" }, undefined, {
        fields: {
          name: {
            ref: nameInput,
            name: "name",
            mount: true,
            required: "Required",
          },
        },
        names: ["name"],
        shouldUseNativeValidation: undefined,
      })
    ).toEqual({
      errors: {
        name: {
          message: "name must be present, but got ",
          ref: nameInput,
          type: "valueMissing",
        },
      },
      values: {},
    });
  });
});
