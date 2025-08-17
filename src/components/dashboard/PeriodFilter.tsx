import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
export type PeriodType = 'current-month' | 'last-3-months' | 'last-6-months' | 'current-year' | 'custom';
interface PeriodFilterProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}
export const PeriodFilter = ({
  value,
  onChange
}: PeriodFilterProps) => {
  return;
};