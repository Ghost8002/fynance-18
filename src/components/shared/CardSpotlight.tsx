
interface CardSpotlightProps {
  children: React.ReactNode;
  className?: string;
}

const CardSpotlight = ({ children, className = '' }: CardSpotlightProps) => {
  return (
    <div className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${className}`}>
      {children}
    </div>
  );
};

export default CardSpotlight;
