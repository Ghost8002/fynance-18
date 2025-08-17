
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
      <div className="container mx-auto max-w-6xl p-6 space-y-8">
        {/* Header Section */}
        <div className="text-left space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <SettingsIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Configurações
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Personalize sua experiência no sistema
              </p>
            </div>
          </div>
        </div>
        
        {/* Settings Tabs */}
        <div className="bg-card rounded-lg border shadow-sm">
          <Tabs defaultValue="profile" className="w-full">
            {/* Tabs List */}
            <div className="border-b px-6 pt-6">
              <TabsList className="grid grid-cols-8 w-full max-w-5xl bg-muted/50 p-1 rounded-lg h-auto">
                {settingsTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className="flex flex-col items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="text-xs">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {settingsTabs.map((tab) => (
                <TabsContent 
                  key={tab.id}
                  value={tab.id}
                  className="mt-0 space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <tab.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">
                          {tab.label}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          Configure as opções de {tab.label.toLowerCase()} do sistema
                        </p>
                      </div>
                    </div>
                    <tab.component />
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
