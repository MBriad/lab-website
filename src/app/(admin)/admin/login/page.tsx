import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "登录",
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
