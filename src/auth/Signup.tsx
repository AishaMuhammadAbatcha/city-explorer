import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";
import { useForm, type SubmitHandler } from "react-hook-form";
import { loginSchema, type LoginSchema } from "./schema";
import CustomTextField from "@/components/inputs/CustomTextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";

const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({ resolver: zodResolver(loginSchema) });
  const navigate = useNavigate();
  const { showToast } = useToast();

  const onSubmit: SubmitHandler<LoginSchema> = async (data) => {
    try {
      // console.log("Login data:", data, "User type:", userType);
      console.log("Login data: ", data);

      // Check if this is a first-time individual user
      // const isFirstTimeUser =
      //   userType === "individual" && !localStorage.getItem("user_interests");

      // if (isFirstTimeUser) {
      //   navigate("/interests");
      // } else {
      //   navigate("/dashboard");
      // }
      navigate("/dashboard");

      showToast("Login successful", "success");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.status === 401 || error.status === 404) {
        showToast(error.data.message, "error");
      } else {
        showToast("Something went wrong", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-bg-primary-dark2 mb-2">
            TR-ACE
          </h1>
          <h2 className="text-xl font-semibold text-gray-700">Welcome</h2>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <CustomTextField
                label=""
                placeholder="Enter your email"
                type="email"
                register={register("username")}
                errorMessage={errors.username}
                className=""
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <CustomTextField
                label=""
                placeholder="Enter your password"
                type="password"
                register={register("password")}
                errorMessage={errors.password}
                checkPassword
                className=""
              />
            </div>

            <Button
              className="w-full bg-bg-primary-dark2 hover:bg-bg-primary-dark2/90"
              type="submit"
              variant="default"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Login
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Have an account?{" "}
              <a
                href="/login"
                className="text-bg-primary-dark2 hover:text-bg-primary-dark2/80 font-medium"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
