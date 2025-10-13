import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import profileImg from "@/assets/image.jpg";

const BusinessDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="bg-white border-1 border-border-primary rounded-md w-full p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="rounded-full border border-border-primary h-16 w-16 sm:h-20 sm:w-20 overflow-hidden flex-shrink-0">
          <img
            src={profileImg}
            alt="Business profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg sm:text-xl">Beauty Bliss</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Top-rated spa and salon</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {dashboardCard.map((item) => (
          <div
            className="bg-white border-1 border-border-primary rounded-md w-full p-4 sm:p-6 flex flex-col gap-4 sm:gap-6"
            key={item.id}
          >
            <h4 className="font-bold text-base sm:text-lg">{item.header}</h4>
            <p className="text-sm sm:text-base text-muted-foreground">{item.text}</p>
            <Button onClick={() => navigate(item.navigateTo)} className="w-full sm:w-auto">
              Add New
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const dashboardCard = [
  {
    id: 1,
    header: "Upcoming Events",
    text: "No events scheduled",
    navigateTo: "/events",
  },
  {
    id: 2,
    header: "Deals & Promos",
    text: "No active promotions",
    navigateTo: "/events",
  },
  { id: 3, header: "Reviews", text: "View feedback", navigateTo: "/events" },
];

export default BusinessDashboard;
