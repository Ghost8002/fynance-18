import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureTabProps {
  icon: ReactNode;
  title: string;
  description: string;
  isActive: boolean;
}

export const FeatureTab = ({ icon, title, description, isActive }: FeatureTabProps) => {
  return (
    <div 
      className={`
        w-full flex items-center gap-4 p-5 rounded-xl
        transition-all duration-300 relative
        ${isActive 
          ? 'glass shadow-lg shadow-primary/10' 
          : 'hover:glass-hover'
        }
      `}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 top-0 w-1 h-full bg-primary rounded-l-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
        <div className={`flex-shrink-0 mt-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {icon}
        </div>
        <div className="text-left min-w-0 flex-1">
          <h3 className={`font-semibold text-sm sm:text-base ${isActive ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};