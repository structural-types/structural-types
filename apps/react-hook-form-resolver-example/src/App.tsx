import { useForm } from "react-hook-form";
import { resolver } from "@structural-types/react-hook-form-resolver";
import * as s from "@structural-types/schema";

const schema = new s.ObjectSchema({
  person: new s.ObjectSchema({
    firstName: new s.CustomErrorSchema(
      new s.StringSchema({ required: true }),
      "First Name is required"
    ),
    age: new s.CustomErrorSchema(
      new s.NumberSchema({
        min: 18,
      }),
      (error) => {
        switch (error.context.type) {
          case "valueMissing":
            return "Age is required";
          case "rangeUnderflow":
            return "Too young";
          default:
            return error.message;
        }
      }
    ),
  }),
});

type FormData = s.SchemaType<typeof schema>;

export default function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    criteriaMode: "all",
    resolver: resolver(schema),
  });
  const onSubmit = (data: FormData) => console.log(data);

  console.log({ errors });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>First Name</label>
      <input
        {...register("person.firstName", {
          required: "Required",
        })}
      />
      <p>{errors.person?.firstName?.message}</p>

      <label>Age</label>
      <input
        {...register("person.age", {
          required: "Required",
          min: { value: 18, message: "Too young" },
          pattern: { value: /\[A-Z]+/, message: "Not a number" },
        })}
      />
      <p>{errors.person?.age?.message}</p>

      <input type="submit" />
    </form>
  );
}
