"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Logo } from "../../components/ui/logo";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(next);
    }, 1000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#FFB000] via-[#FF2D95] to-[#5B8CFF] opacity-30" />
      <Card className="w-full max-w-sm p-6">
        <Logo className="mx-auto mb-6 h-12 w-12" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" required />
          <Input type="password" placeholder="Password" required />
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#FFB000] via-[#FF2D95] to-[#5B8CFF] text-black"
          >
            {loading ? "Loading..." : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
