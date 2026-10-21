"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** /school root redirects to the unified dashboard */
export default function SchoolRootPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard"); }, [router]);
  return null;
}
