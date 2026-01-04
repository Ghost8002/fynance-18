import { motion } from "framer-motion";

const mediaLogos = [
  { name: "InfoMoney", initials: "IM" },
  { name: "Exame", initials: "EX" },
  { name: "Estadão", initials: "ES" },
  { name: "Valor", initials: "VL" },
  { name: "Forbes", initials: "FB" },
];

export const MediaLogosSection = () => {
  return (
    <section className="py-10 sm:py-14 bg-muted/30 border-y border-border/50">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-8"
        >
          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-medium">
            Reconhecido pela mídia
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16"
        >
          {mediaLogos.map((logo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="group"
            >
              <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  {logo.initials}
                </div>
                <span className="text-sm sm:text-base font-medium tracking-tight">
                  {logo.name}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
