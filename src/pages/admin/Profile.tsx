import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, User, Shield, Clock } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
        setAvatarUrl(profileData.avatar_url || "");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      fetchUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-navy mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Informações Pessoais
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Atividades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-golden text-white flex items-center justify-center text-3xl font-bold">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div>
                  <Button variant="outline" size="sm" className="mb-2">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Nova Foto
                  </Button>
                  <p className="text-sm text-gray-500">JPG ou PNG. Máximo 2MB.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">O email não pode ser alterado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">URL do Avatar (opcional)</Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://exemplo.com/avatar.jpg"
                />
              </div>

              <Button onClick={handleUpdateProfile}>Salvar Alterações</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>Detalhes sobre sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">ID do Usuário</span>
                <span className="font-mono text-sm">{user?.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Conta Criada</span>
                <span className="font-medium">
                  {new Date(user?.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Última Atualização</span>
                <span className="font-medium">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : 'Nunca'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Função</span>
                <span className="px-3 py-1 bg-navy text-white text-sm rounded-full">Admin</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerencie suas configurações de segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Alterar Senha</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Recomendamos alterar sua senha regularmente
                </p>
                <Button variant="outline">Alterar Senha</Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2">Autenticação de Dois Fatores</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Adicione uma camada extra de segurança à sua conta
                </p>
                <Button variant="outline">Configurar 2FA</Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-2 text-red-600">Zona de Perigo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ações irreversíveis relacionadas à sua conta
                </p>
                <Button variant="destructive" size="sm">Desativar Conta</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Suas ações mais recentes no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Upload de PDF processado</p>
                    <p className="text-sm text-gray-600">Universo "Harry Potter" foi criado com sucesso</p>
                    <p className="text-xs text-gray-400 mt-1">Há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 pb-4 border-b">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Perfil atualizado</p>
                    <p className="text-sm text-gray-600">Informações pessoais foram modificadas</p>
                    <p className="text-xs text-gray-400 mt-1">Há 1 dia</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 pb-4">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                  <div className="flex-1">
                    <p className="font-medium">Login realizado</p>
                    <p className="text-sm text-gray-600">Chrome - São Paulo, Brasil</p>
                    <p className="text-xs text-gray-400 mt-1">Há 2 dias</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
