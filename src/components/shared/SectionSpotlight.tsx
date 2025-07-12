
interface SectionSpotlightProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

const SectionSpotlight = ({ children, className = '' }: SectionSpotlightProps) => {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
};

export default SectionSpotlight;
