import { Card, CardContent } from "@/components/ui/card";

const MetricCard = ({ label, value, trend, icon: Icon }) => {
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        {trend && (
          <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
