import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  colors?: Array<{ value: string; label: string }>;
}

const defaultColors = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#EF4444", label: "Vermelho" },
  { value: "#10B981", label: "Verde" },
  { value: "#F59E0B", label: "Laranja" },
  { value: "#8B5CF6", label: "Roxo" },
  { value: "#6B7280", label: "Cinza" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#14B8A6", label: "Turquesa" },
  { value: "#F97316", label: "Laranja Vibrante" },
  { value: "#84CC16", label: "Lima" }
];

export const ColorPicker = ({ 
  value, 
  onChange, 
  label = "Cor", 
  colors = defaultColors 
}: ColorPickerProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="color">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {colors.map((color) => (
            <SelectItem key={color.value} value={color.value}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: color.value }}
                />
                {color.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ColorPicker;
