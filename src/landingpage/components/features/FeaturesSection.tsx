import { Tabs, TabsList, TabsTrigger } from "@/landingpage/components/ui/tabs";
import { FeatureTab } from "./FeatureTab";
import { features } from "@/landingpage/config/features";

export const FeaturesSection = () => {
  return (
    <section className="container px-4 py-16 sm:py-24 bg-gray-50 dark:bg-gray-800">
      {/* Header Section */}
      <div className="max-w-2xl mb-10 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal mb-4 sm:mb-6 tracking-tight text-left text-gray-900 dark:text-gray-100">
          Tudo que você precisa
          <br />
          <span className="text-gradient font-medium">para organizar seu dinheiro</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 text-left">
          Ferramentas simples e poderosas para você finalmente ter controle total das suas finanças.
        </p>
      </div>

      <Tabs defaultValue={features[0].title} className="w-full">
        <div className="grid grid-cols-1 gap-8 sm:gap-12">
          {/* Tab triggers */}
          <div className="space-y-2 sm:space-y-3">
            <TabsList className="flex flex-col w-full bg-transparent h-auto p-0 space-y-2 sm:space-y-3">
              {features.map((feature) => (
                <TabsTrigger
                  key={feature.title}
                  value={feature.title}
                  className="w-full data-[state=active]:shadow-none data-[state=active]:bg-transparent p-0"
                >
                  <FeatureTab
                    title={feature.title}
                    description={feature.description}
                    icon={feature.icon}
                    isActive={false}
                  />
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>
      </Tabs>
    </section>
  );
};
