import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá. Sou o Lumen, sua janela para os universos narrativos. Como posso ajudá-lo a explorar suas histórias favoritas hoje?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages([...messages, newMessage]);
    setInput("");

    // Simulação de resposta da IA
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Esta é uma resposta de demonstração. A integração com IA será implementada em breve.",
        },
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg shadow-elegant">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          Conversa Narrativa
        </h3>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          Explore através do diálogo
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground border border-border"
                }`}
              >
                <p className={`text-sm ${message.role === "assistant" ? "font-mono" : ""}`}>
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-secondary/30">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua pergunta sobre o universo..."
            className="flex-1 font-mono bg-card"
          />
          <Button onClick={handleSend} size="icon" className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
