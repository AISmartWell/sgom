import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterCriteria } from "@/hooks/useWellRanking";

interface WellFiltersProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: Partial<FilterCriteria>) => void;
  disabled?: boolean;
}

const WellFilters = ({ filters, onFiltersChange, disabled }: WellFiltersProps) => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Filter Criteria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Region Select */}
        <div className="space-y-2">
          <Label>Region</Label>
          <Select
            value={filters.region}
            onValueChange={(value) => onFiltersChange({ region: value })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Oklahoma">Oklahoma - Anadarko Basin</SelectItem>
              <SelectItem value="Texas">Texas - Permian Basin</SelectItem>
              <SelectItem value="NewMexico">New Mexico - Delaware Basin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Remaining Years */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Min. Remaining Life</Label>
            <span className="text-sm text-muted-foreground">{filters.minRemainingYears} years</span>
          </div>
          <Slider
            value={[filters.minRemainingYears]}
            onValueChange={([value]) => onFiltersChange({ minRemainingYears: value })}
            min={0}
            max={30}
            step={1}
            disabled={disabled}
          />
        </div>

        {/* Max Water Cut */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Max. Water Cut</Label>
            <span className="text-sm text-muted-foreground">{filters.maxWaterCut}%</span>
          </div>
          <Slider
            value={[filters.maxWaterCut]}
            onValueChange={([value]) => onFiltersChange({ maxWaterCut: value })}
            min={0}
            max={100}
            step={5}
            disabled={disabled}
          />
        </div>

        {/* Include Closed Wells */}
        <div className="flex items-center justify-between">
          <Label>Include Closed Wells</Label>
          <Switch
            checked={filters.includeClosedWells}
            onCheckedChange={(checked) => onFiltersChange({ includeClosedWells: checked })}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WellFilters;
