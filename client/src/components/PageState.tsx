import { Button, Container, Skeleton } from "@shared/ui";

interface PageStateProps {
  kind: "loading" | "error" | "empty";
  message?: string;
  onRetry?: () => void;
}

export function PageState({ kind, message, onRetry }: PageStateProps) {
  if (kind === "loading") {
    return (
      <Container className="py-24">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full max-w-[36ch]" />
          <Skeleton className="h-4 w-full max-w-[52ch]" />
          <Skeleton className="h-4 w-full max-w-[46ch]" />
          <Skeleton className="mt-10 h-64 w-full" />
        </div>
        <span className="sr-only">Loading</span>
      </Container>
    );
  }

  return (
    <Container className="py-24">
      <h1 className="text-step-3">{kind === "empty" ? "Nothing here yet" : "This page could not load"}</h1>
      <p className="mt-3 max-w-[60ch] text-ink-2">
        {message || "The content service is not responding. It may still be starting up."}
      </p>
      {onRetry ? (
        <Button onClick={onRetry} className="mt-6">
          Try again
        </Button>
      ) : null}
    </Container>
  );
}
