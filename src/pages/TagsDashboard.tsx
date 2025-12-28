import AppLayout from "@/components/shared/AppLayout";
import TagsOverview from "@/components/tags/TagsOverview";
import TagsIncomeExpenseChart from "@/components/tags/TagsIncomeExpenseChart";
import TagsTransactionsList from "@/components/tags/TagsTransactionsList";
import TagsStatsCards from "@/components/tags/TagsStatsCards";
import CategoriesTagsAnalysis from "@/components/tags/CategoriesTagsAnalysis";

const TagsDashboard = () => {

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard de Tags</h1>
          <p className="text-muted-foreground">Visualize suas receitas e despesas organizadas por tags e categorias</p>
        </div>
        
        <TagsStatsCards />
        <CategoriesTagsAnalysis />
        <TagsOverview />
        <TagsIncomeExpenseChart />
        <TagsTransactionsList />
      </div>
    </AppLayout>
  );
};

export default TagsDashboard;
