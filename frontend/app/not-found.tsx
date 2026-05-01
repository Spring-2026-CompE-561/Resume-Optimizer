import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <CardTitle className="mb-3">Page not found</CardTitle>
        <CardDescription className="mb-6">
          The requested route does not exist in the refactored frontend.
        </CardDescription>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </Card>
    </main>
  );
}
