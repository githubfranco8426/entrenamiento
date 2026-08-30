import { DumbbellIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExerciseThumbnail({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
          className,
        )}
      >
        <DumbbellIcon className="size-4" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria pegada por el usuario, sin dominio fijo para next/image
    <img
      src={src}
      alt={alt}
      className={cn("size-9 shrink-0 rounded-lg border object-cover", className)}
    />
  );
}
