import { useState } from "react";
import supabase from "~/lib/supabase/client";

export default function Playground() {
  const [file, setFile] = useState<File | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(file);
    if (!file) return;
    console.log(file.name);
    const { data, error } = await supabase.storage
      .from("chat-message-attachments")
      .upload(`roomName/${file.name}`, file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={handleFileChange} />
      <div>{file?.name}</div>
      <button type="submit">Submit</button>
    </form>
  );
}
