import { Bell } from "lucide-react";

const BusinessNotifications = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      <div className="flex justify-between mb-6">
        <h3 className="font-bold text-2xl">Notifications</h3>
      </div>
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Notifications</h3>
        <p className="text-gray-600 dark:text-gray-400">You're all caught up! Notifications will appear here.</p>
      </div>
    </div>
  );
};

export default BusinessNotifications;
