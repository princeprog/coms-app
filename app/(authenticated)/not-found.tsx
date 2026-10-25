import { NotFoundState } from "@/components/shared/not-found-state";

export default function AuthenticatedNotFound() {
  return (
    <NotFoundState
      variant="inline"
      description="This page is unavailable or you do not have access to it."
    />
  );
}
