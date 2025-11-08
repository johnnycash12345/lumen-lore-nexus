import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UniverseChatProps {
  universeId: string;
  universeName: string;
}

export const UniverseChat = ({ universeId, universeName }: UniverseChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Olá! Sou seu guia enciclopédico para o universo "${universeName}". Faça perguntas sobre personagens, locais, eventos ou objetos e responderei com base nas informações disponíveis.`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('universe-chat', {
        body: { question: input, universeId }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao processar pergunta");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      <div className="p-4 border-b bg-muted/50">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chat Enciclopédico - {universeName}
        </h3>
        <p className="text-sm text-muted-foreground">
          Modo: Enciclopédia (Deepseek)
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            }`}>
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <Card className={`p-3 max-w-[80%] ${
              message.role === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </Card>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <Card className="p-3 bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Card>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-muted/50">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Faça uma pergunta sobre o universo..."
            className="resize-none"
            rows={2}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
