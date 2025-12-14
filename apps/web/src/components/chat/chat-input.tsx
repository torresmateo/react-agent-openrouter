import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  onSendMessage,
  disabled,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  return (
    <form className="flex gap-2 border-t p-4" onSubmit={handleSubmit}>
      <Input
        className="flex-1"
        disabled={disabled}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        value={message}
      />
      <Button disabled={disabled || !message.trim()} size="icon" type="submit">
        <Send className="size-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
