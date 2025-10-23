import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const monthlyData = [
  { name: "Jan", views: 400, clicks: 240, bookings: 24 },
  { name: "Feb", views: 300, clicks: 139, bookings: 22 },
  { name: "Mar", views: 200, clicks: 980, bookings: 29 },
  { name: "Apr", views: 278, clicks: 390, bookings: 20 },
  { name: "May", views: 189, clicks: 480, bookings: 27 },
  { name: "Jun", views: 239, clicks: 380, bookings: 25 },
];

const categoryData = [
  { name: "Events", value: 400, color: "#3884fd" },
  { name: "Deals", value: 300, color: "#10b981" },
  { name: "Reviews", value: 200, color: "#f59e0b" },
  { name: "Direct", value: 100, color: "#ef4444" },
];

const BusinessAnalytics = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      <div className="flex justify-between">
        <h3 className="font-bold">Business Analytics</h3>
      </div>
      
      {/* Analytics Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {analyticsCard.map((item) => (
          <div
            className="bg-white border border-border-primary rounded-lg p-6 shadow-sm"
            key={item.id}
          >
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{item.header}</h4>
              <p className="text-3xl font-bold text-bg-primary-dark2">{item.value}</p>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Chart */}
        <div className="bg-white border border-border-primary rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Monthly Performance</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#3884fd" name="Views" />
              <Bar dataKey="clicks" fill="#10b981" name="Clicks" />
              <Bar dataKey="bookings" fill="#f59e0b" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white border border-border-primary rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Traffic Sources</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="mt-6">
        <div className="bg-white border border-border-primary rounded-lg p-6 shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Engagement Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#3884fd" 
                strokeWidth={2}
                name="Views"
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Clicks"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const analyticsCard = [
  {
    id: 1,
    header: "Total Views",
    value: "1,234",
  },
  {
    id: 2,
    header: "Total Clicks",
    value: "532",
  },
  {
    id: 3,
    header: "New Reviews",
    value: "34",
  },
  {
    id: 4,
    header: "Bookings",
    value: "78",
  },
];

export default BusinessAnalytics;
