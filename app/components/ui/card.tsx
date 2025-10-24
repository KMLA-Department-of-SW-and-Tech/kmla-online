export default function Card({
  className,
  children,
  ...props
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
