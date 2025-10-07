
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileSettings from "@/components/settings/ProfileSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import GeneralSettings from "@/components/settings/GeneralSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import CategorySettings from "@/components/settings/CategorySettings";
import TagSettings from "@/components/settings/TagSettings";
import AccountSettings from "@/components/settings/AccountSettings";
import SectionSpotlight from "@/components/shared/SectionSpotlight";
import { DashboardCustomization } from "@/components/dashboard/DashboardCustomization";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Tag, Sliders, Layout, UserCog } from "lucide-react";

const Settings = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const settingsTabs = [
    {
      id: "profile",
      label: "Perfil",
      icon: User,
      component: ProfileSettings
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Layout,
      component: () => (
        <div className="space-y-6">
          <div className="text-left">
            <h3 className="text-lg font-medium mb-2">Personalização do Dashboard</h3>
            <p className="text-muted-foreground mb-6">
              Configure quais widgets deseja exibir no seu dashboard
            </p>
            <DashboardCustomization />
          </div>
        </div>
      )
    },
    {
      id: "categories",
      label: "Categorias",
      icon: Palette,
      component: CategorySettings
    },
    {
      id: "tags",
      label: "Tags",
      icon: Tag,
      component: TagSettings
    },
    {
      id: "notifications",
      label: "Notificações",
      icon: Bell,
      component: NotificationSettings
    },
    {
      id: "general",
      label: "Geral",
      icon: Sliders,
      component: GeneralSettings
    },
    {
      id: "security",
      label: "Segurança",
      icon: Shield,
      component: SecuritySettings
    },
    {
      id: "account",
      label: "Conta",
      icon: UserCog,
      component: AccountSettings
    }
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg">
                <SettingsIcon className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-5xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Configurações
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Personalize sua experiência e configure o sistema conforme suas necessidades
                </p>
              </div>
            </div>
          </div>
          
          {/* Settings Tabs */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border shadow-xl overflow-hidden">
            <Tabs defaultValue="profile" className="w-full">
              {/* Tabs List */}
              <div className="border-b bg-muted/30 px-8 py-6">
                <TabsList className="grid grid-cols-4 md:grid-cols-8 w-full bg-transparent p-0 h-auto gap-2">
                  {settingsTabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id}
                      className="flex flex-col items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:scale-105 hover:bg-background/60 hover:scale-105 group"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground transition-all duration-300">
                        <tab.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab Contents */}
              <div className="p-8">
                {settingsTabs.map((tab) => (
                  <TabsContent 
                    key={tab.id}
                    value={tab.id}
                    className="mt-0 space-y-8"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md">
                          <tab.icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-3xl font-bold text-foreground">
                            {tab.label}
                          </h2>
                          <p className="text-muted-foreground text-base">
                            Configure as opções de {tab.label.toLowerCase()} do sistema
                          </p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <tab.component />
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
