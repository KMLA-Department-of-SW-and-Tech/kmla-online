import { useRef } from "react";
import { Button } from "./ui/button";

export default function IconFileInput({
  className,
  onChange,
  children,
}: React.ComponentProps<"input">) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };
  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={onChange}
        className="hidden"
      />
      <Button className={className} onClick={handleButtonClick}>
        {children}
      </Button>
    </>
  );
}
