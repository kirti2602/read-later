import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Read Later" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Read Later</h1>
      <LoginForm />
    </main>
  );
}
