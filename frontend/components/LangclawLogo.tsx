import Image from "next/image";

import { LANGCLAW_LOGO_URL } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

type LangclawLogoProps = {
  className?: string;
  imageClassName?: string;
};

export function LangclawLogo({
  className,
  imageClassName,
}: LangclawLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block overflow-hidden bg-white", className)}
    >
      <Image
        alt=""
        className={cn(
          "absolute top-1/2 left-1/2 h-[168px] w-[168px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain",
          imageClassName,
        )}
        decoding="async"
        draggable={false}
        height={168}
        src={LANGCLAW_LOGO_URL}
        width={168}
      />
    </span>
  );
}
