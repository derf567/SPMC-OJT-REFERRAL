import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock } from "lucide-react";

const ambulances = [
  {
    id: "AMB-001",
    driver: "John Martinez",
    status: "Available",
    location: "SPMC Main",
    eta: null,
  },
  {
    id: "AMB-002",
    driver: "Sarah Johnson",
    status: "En Route",
    location: "City General → SPMC",
    eta: "15 mins",
  },
  {
    id: "AMB-003",
    driver: "Mike Chen",
    status: "Busy",
    location: "Regional Medical",
    eta: "30 mins",
  },
  {
    id: "AMB-004",
    driver: "Lisa Rodriguez",
    status: "Available",
    location: "Emergency Station",
    eta: null,
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "Available":
      return "outline";
    case "En Route":
      return "default";
    case "Busy":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Available":
      return "text-green-600";
    case "En Route":
      return "text-blue-600";
    case "Busy":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
};

export const AmbulanceStatus = () => {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Ambulance Fleet Status</h3>
            <p className="text-sm text-muted-foreground">Real-time ambulance tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">4 Units Active</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ambulances.map((ambulance) => (
            <div key={ambulance.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">{ambulance.id}</h4>
                <Badge variant={getStatusVariant(ambulance.status)}>
                  {ambulance.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-muted-foreground">{ambulance.driver}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{ambulance.location}</span>
                </div>
                
                {ambulance.eta && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">ETA: {ambulance.eta}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};