
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Clock } from "lucide-react";

// Mock data for tutorial videos
const tutorialVideos = [
  {
    id: "1",
    title: "Primeiros passos com o Vida Financeira",
    description: "Aprenda a configurar sua conta e começar a usar o aplicativo",
    thumbnail: "https://placehold.co/600x400/e2e8f0/94a3b8?text=Tutorial+1",
    duration: "5:30",
    category: "Iniciante",
  },
  {
    id: "2",
    title: "Como criar e gerenciar orçamentos",
    description: "Defina limites de gastos por categoria e mantenha-se no controle",
    thumbnail: "https://placehold.co/600x400/e2e8f0/94a3b8?text=Tutorial+2",
    duration: "8:45",
    category: "Intermediário",
  },
  {
    id: "3",
    title: "Criando metas financeiras eficazes",
    description: "Técnicas para definir metas realistas e alcançáveis",
    thumbnail: "https://placehold.co/600x400/e2e8f0/94a3b8?text=Tutorial+3",
    duration: "7:20",
    category: "Intermediário",
  },
  {
    id: "4",
    title: "Relatórios avançados para análise financeira",
    description: "Aprenda a extrair insights valiosos dos relatórios disponíveis",
    thumbnail: "https://placehold.co/600x400/e2e8f0/94a3b8?text=Tutorial+4",
    duration: "12:15",
    category: "Avançado",
  },
  {
    id: "5",
    title: "Integração de contas bancárias e cartões",
    description: "Como conectar suas contas externas ao sistema",
    thumbnail: "https://placehold.co/600x400/e2e8f0/94a3b8?text=Tutorial+5",
    duration: "9:50",
    category: "Intermediário",
  },
  {
    id: "6",
    title: "Planejamento financeiro para longo prazo",
    description: "Estratégias para aposentadoria e grandes objetivos financeiros",
    thumbnail: "https://placehold.co/600x400/e2e8f0/94a3b8?text=Tutorial+6",
    duration: "15:30",
    category: "Avançado",
  },
];

const TutorialVideos = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tutoriais em Vídeo</h2>
          <p className="text-gray-500">Aprenda a usar todos os recursos do Vida Financeira</p>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline">Todos</Badge>
          <Badge variant="outline" className="bg-blue-50">Iniciante</Badge>
          <Badge variant="outline">Intermediário</Badge>
          <Badge variant="outline">Avançado</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorialVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="relative">
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-white rounded-full p-3">
                  <Play className="h-6 w-6 text-finance-blue" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {video.duration}
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{video.title}</CardTitle>
                <Badge variant="outline" className={
                  video.category === "Iniciante" ? "bg-blue-50" : 
                  video.category === "Intermediário" ? "bg-green-50" : 
                  "bg-purple-50"
                }>
                  {video.category}
                </Badge>
              </div>
              <CardDescription>{video.description}</CardDescription>
            </CardHeader>
            
            <CardFooter>
              <button className="text-finance-blue text-sm font-medium hover:underline">
                Assistir tutorial
              </button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TutorialVideos;
