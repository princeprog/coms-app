export default function AuthenticatedNotFound() {
  return (
    <section className="m-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center">
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">
        This page is unavailable or you do not have access to it.
      </p>
    </section>
  );
}
