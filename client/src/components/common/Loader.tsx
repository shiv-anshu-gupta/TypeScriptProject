/**
 * The full-screen spinner shown while the route guards wait.
 *
 * @packageDocumentation
 */
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const wrapClass = "flex min-h-screen w-full items-center justify-center";

const contentClass =
  "flex flex-col items-center gap-3 text-sm text-muted-foreground";

const iconClass = "h-8 w-8 animate-spin text-primary";

/** Props for {@link Commonloader}. */
type CommonLoaderProps = {
  /** Message under the spinner. Defaults to "Loading...". */
  text?: string;
  /**
   * Classes for the outer wrapper.
   *
   * @remarks
   * Merged with `cn`, so a `min-h-*` utility passed here overrides the default
   * full-screen height rather than conflicting with it. That is how to reuse
   * this loader inside a panel.
   */
  className?: string;
  /** Classes for the spinner icon, merged the same way. */
  iconClassName?: string;
};

/**
 * A centred spinner with a caption.
 *
 * @remarks
 * Used by all three route guards while Clerk resolves the session and the auth
 * bootstrap finishes. It fills the viewport by default, because at that point
 * there is no layout around it.
 *
 * Note the lower-case `l` in the name — it is `Commonloader`, not
 * `CommonLoader`, which makes it easy to miss when searching.
 */
export function Commonloader({
  text = "Loading...",
  className,
  iconClassName,
}: CommonLoaderProps) {
  return (
    <div className={cn(wrapClass, className)}>
      <div className={contentClass}>
        <Loader2 className={cn(iconClass, iconClassName)} />
        <p>{text}</p>
      </div>
    </div>
  );
}
