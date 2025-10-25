import { cn } from "~/lib/utils";

export default function Card({
  className,
  children,
  ...props
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "bg-[#ffffffb2] shadow-[0px_4px_20px_0px_#0000001A] rounded-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
