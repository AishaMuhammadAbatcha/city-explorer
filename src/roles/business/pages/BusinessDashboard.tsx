import { useNavigate } from "react-router";
import { Calendar, Tag, MessageCircle, TrendingUp, Users, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BusinessDashboard = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 1,
      title: "Manage Events",
      description: "Create and manage your business events",
      icon: Calendar,
      navigateTo: "/business/events",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      id: 2,
      title: "Deals & Promos",
      description: "Set up promotions for your customers",
      icon: Tag,
      navigateTo: "/business/deals",
      color: "text-green-600 dark:text-green-400"
    },
    {
      id: 3,
      title: "Reviews",
      description: "Respond to customer feedback",
      icon: MessageCircle,
      navigateTo: "/business/reviews",
      color: "text-purple-600 dark:text-purple-400"
    },
  ];

  const stats = [
    { label: "Total Views", value: "0", icon: Users, change: "+0%" },
    { label: "Rating", value: "0.0", icon: Star, change: "0" },
    { label: "Engagement", value: "0%", icon: TrendingUp, change: "+0%" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Stats Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(action.navigateTo)}
              >
                <CardContent className="p-6">
                  <Icon className={`h-10 w-10 mb-3 ${action.color}`} />
                  <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
