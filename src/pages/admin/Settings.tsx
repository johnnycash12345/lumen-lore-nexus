import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Database, Bell, Shield, Palette } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [processingNotifications, setProcessingNotifications] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSaveGeneral = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações gerais foram atualizadas com sucesso.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notificações atualizadas",
      description: "Suas preferências de notificação foram salvas.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-navy mb-2">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Banco de Dados
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Configure as opções básicas do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="site-name">Nome do Site</Label>
                <Input id="site-name" defaultValue="Lumen Encyclopedic" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Descrição</Label>
                <Input id="tagline" defaultValue="Enciclopédia de Universos Literários" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Publicação Automática</Label>
                  <p className="text-sm text-gray-500">Publicar universos automaticamente após processamento</p>
                </div>
                <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Manutenção</Label>
                  <p className="text-sm text-gray-500">Desabilitar acesso público temporariamente</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <Button onClick={handleSaveGeneral}>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Banco de Dados</CardTitle>
              <CardDescription>Ferramentas de manutenção e backup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Backup Automático</h3>
                  <p className="text-sm text-gray-600 mb-4">Último backup: Hoje, 03:00</p>
                  <Button variant="outline" size="sm">Fazer Backup Agora</Button>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Limpeza de Cache</h3>
                  <p className="text-sm text-gray-600 mb-4">Cache: 245 MB</p>
                  <Button variant="outline" size="sm">Limpar Cache</Button>
                </Card>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Estatísticas de Armazenamento</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Universos</span>
                    <span className="font-semibold">1.2 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Entidades</span>
                    <span className="font-semibold">450 MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Relacionamentos</span>
                    <span className="font-semibold">120 MB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Configure como você deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-gray-500">Receber emails sobre atualizações importantes</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Processamento</Label>
                  <p className="text-sm text-gray-500">Alertas quando PDFs forem processados</p>
                </div>
                <Switch checked={processingNotifications} onCheckedChange={setProcessingNotifications} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email para Notificações</Label>
                <Input id="email" type="email" placeholder="admin@lumen.com" />
              </div>
              <Button onClick={handleSaveNotifications}>Salvar Preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>Gerencie a segurança da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Autenticação</h3>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">Configurar 2FA</Button>
                    <p className="text-sm text-gray-500">Adicionar autenticação de dois fatores</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sessões Ativas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Sessão atual</p>
                        <p className="text-sm text-gray-500">Chrome - São Paulo, Brasil</p>
                      </div>
                      <Button variant="outline" size="sm">Encerrar</Button>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Alteração de Senha</h3>
                  <Button variant="outline" size="sm">Alterar Senha</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalização de Aparência</CardTitle>
              <CardDescription>Ajuste a aparência do painel administrativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tema</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4 cursor-pointer border-2 border-navy bg-white">
                    <div className="h-20 bg-gradient-to-br from-cream to-white rounded mb-2"></div>
                    <p className="text-sm font-medium text-center">Claro</p>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-navy">
                    <div className="h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded mb-2"></div>
                    <p className="text-sm font-medium text-center">Escuro</p>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:border-navy">
                    <div className="h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded mb-2"></div>
                    <p className="text-sm font-medium text-center">Auto</p>
                  </Card>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor Principal</Label>
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-full bg-navy cursor-pointer ring-2 ring-offset-2 ring-navy"></div>
                  <div className="w-10 h-10 rounded-full bg-golden cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-golden"></div>
                  <div className="w-10 h-10 rounded-full bg-blue-600 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-600"></div>
                  <div className="w-10 h-10 rounded-full bg-purple-600 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-purple-600"></div>
                </div>
              </div>
              <Button>Aplicar Tema</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
