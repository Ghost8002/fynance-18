import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, FileCheck, UserCheck } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "Criptografia AES-256",
    description: "O mesmo padrão usado por bancos para proteger seus dados.",
  },
  {
    icon: Shield,
    title: "Conformidade LGPD",
    description: "Seus dados são tratados conforme a Lei Geral de Proteção de Dados.",
  },
  {
    icon: Eye,
    title: "Privacidade Total",
    description: "Nunca vendemos seus dados. Sua privacidade é nossa prioridade.",
  },
  {
    icon: Server,
    title: "Infraestrutura Segura",
    description: "Servidores com certificação SOC 2 e backups automáticos.",
  },
  {
    icon: FileCheck,
    title: "Auditoria Constante",
    description: "Monitoramento 24/7 e testes de segurança regulares.",
  },
  {
    icon: UserCheck,
    title: "Autenticação 2FA",
    description: "Camada extra de proteção para sua conta.",
  },
];

export const SecuritySection = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-finance-green/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-finance-green/10 text-finance-green text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Segurança
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            Seus dados estão seguros
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Utilizamos as mesmas tecnologias de segurança dos maiores bancos do mundo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group flex items-start gap-4 p-5 sm:p-6 rounded-xl bg-card border border-border hover:border-finance-green/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-finance-green/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-finance-green" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 sm:mt-16"
        >
          <div className="bg-card border-2 border-finance-green/20 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                Certificações e Segurança
              </h3>
              <p className="text-sm text-muted-foreground">
                Seus dados protegidos com os mais altos padrões de segurança
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50 border border-finance-green/10 hover:border-finance-green/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-finance-green/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-finance-green" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground mb-1">SSL Certificado</p>
                  <p className="text-xs text-muted-foreground">Conexão segura</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50 border border-finance-green/10 hover:border-finance-green/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-finance-green/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-finance-green" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground mb-1">256-bit Encryption</p>
                  <p className="text-xs text-muted-foreground">Criptografia bancária</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50 border border-finance-green/10 hover:border-finance-green/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-finance-green/10 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-finance-green" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground mb-1">LGPD Compliant</p>
                  <p className="text-xs text-muted-foreground">100% conforme</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
