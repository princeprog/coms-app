import type { Metadata } from "next";
import { NotFoundState } from "@/components/shared/not-found-state";

export const metadata: Metadata = {
  title: "Page not found | Emma's Chicken House",
};

export default function NotFound() {
  return <NotFoundState />;
}
