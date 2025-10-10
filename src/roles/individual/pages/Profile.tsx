import React, { useState, useEffect } from "react";
import {
  Star,
  Camera,
  CreditCard,
  Settings,
  Bell,
  Mail,
  MessageCircle,
  Palette,
  Shield,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewService } from "@/services/reviewService";
import { FavoriteService } from "@/services/favoriteService";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface UserStats {
  favoriteCount: number;
  reviewCount: number;
  photos: number;
}

const Profile: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("favorites");
  const [stats, setStats] = useState<UserStats>({ favoriteCount: 0, reviewCount: 0, photos: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      if (!profile) return;

      try {
        setLoadingStats(true);
        const [favoriteCount, userReviews] = await Promise.all([
          FavoriteService.getUserFavoritesCount(),
          ReviewService.getReviewsByUser(profile.id),
        ]);

        setStats({
          favoriteCount,
          reviewCount: userReviews?.length || 0,
          photos: 0, // TODO: Implement photo count
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [profile]);

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    let completed = 0;
    const fields = ['full_name', 'phone', 'address', 'city'];
    fields.forEach(field => {
      if (profile[field as keyof typeof profile]) completed++;
    });
    if (profile.avatar_url) completed++;
    return Math.round((completed / (fields.length + 1)) * 100);
  };

  const profileData = {
    name: profile?.full_name || user?.email?.split('@')[0] || "User",
    bio: profile?.role === 'business' ? "Business Owner" : "Explorer",
    email: profile?.email || user?.email || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    points: stats.favoriteCount * 10 + stats.reviewCount * 5, // Simple points calculation
    reviews: stats.reviewCount,
    photos: stats.photos,
    profileCompletion: calculateProfileCompletion(),
  };

  const favoriteMenuItems: MenuItem[] = [
    { id: "favorites", label: "Favorites", icon: <Star className="w-5 h-5" />, count: stats.favoriteCount },
    { id: "points", label: "My Points", icon: <Star className="w-5 h-5" /> },
    {
      id: "reviews",
      label: "Reviews",
      icon: <MessageCircle className="w-5 h-5" />,
      count: stats.reviewCount,
    },
    { id: "photos", label: "Photos", icon: <Camera className="w-5 h-5" /> },
    {
      id: "payments",
      label: "Payments",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const settingsMenuItems: MenuItem[] = [
    {
      id: "push",
      label: "Push Notifications",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "email",
      label: "Email Notifications",
      icon: <Mail className="w-5 h-5" />,
    },
    {
      id: "messaging",
      label: "Direct Messaging",
      icon: <MessageCircle className="w-5 h-5" />,
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: <Settings className="w-5 h-5" />,
    },
    { id: "theme", label: "Theme", icon: <Palette className="w-5 h-5" /> },
    {
      id: "security",
      label: "Security & Login",
      icon: <Shield className="w-5 h-5" />,
    },
    { id: "logout", label: "Logout", icon: <LogOut className="w-5 h-5" /> },
  ];

  const handleSectionClick = (sectionId: string): void => {
    if (sectionId === "logout") {
      handleLogout();
    } else {
      setActiveSection(sectionId);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setLoggingOut(true);
      const { error } = await signOut();
      if (error) {
        toast.error("Failed to logout: " + error.message);
      } else {
        toast.success("Logged out successfully");
        navigate("/login");
      }
    } catch (error) {
      toast.error("An error occurred during logout");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleMyBusinessPage = (): void => {
    toast.info("Business page feature coming soon!");
  };

  const handlePlanMyDay = (): void => {
    navigate("/ai");
  };

  const handleEditProfile = (): void => {
    navigate("/edit-profile");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="p-6 ">
        <div className="flex items-start space-x-4 bg-bg-primary border border-border-primary p-6 rounded-lg">
          {/* Profile Avatar */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profileData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-600 text-xl font-bold">
                {profileData.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1 truncate">
              {profileData.name}
            </h1>
            <p className="text-gray-600 mb-3">{profileData.bio}</p>

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4 flex-wrap gap-2">
              {loadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    <strong className="text-gray-900">{profileData.points}</strong>{" "}
                    Points
                  </span>
                  <span>
                    <strong className="text-gray-900">{profileData.reviews}</strong>{" "}
                    Reviews
                  </span>
                  <span>
                    <strong className="text-gray-900">{profileData.photos}</strong>{" "}
                    Photos
                  </span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mb-4 flex-wrap gap-2">
              <Button onClick={handleMyBusinessPage} size="sm">My Business Page</Button>
              <Button onClick={handlePlanMyDay} variant="outline" size="sm">
                Plan My Day
              </Button>
              <Button onClick={handleEditProfile} variant="outline" size="sm">
                Edit Profile
              </Button>
            </div>

            {/* Profile Completion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Profile Completion: {profileData.profileCompletion}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profileData.profileCompletion}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites Section */}
      <div className="p-6 ">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Favorites</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {favoriteMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={`p-4 rounded-lg border border-border-primary bg-white hover:bg-gray-50 transition-colors duration-200 text-center ${
                activeSection === item.id
                  ? "ring-2 ring-blue-500 border-blue-500"
                  : ""
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="text-gray-600 relative">
                  {item.icon}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {item.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Section */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
        <div className="space-y-2">
          {settingsMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "settings") {
                  handleEditProfile();
                } else if (item.id === "logout") {
                  handleLogout();
                } else {
                  handleSectionClick(item.id);
                }
              }}
              disabled={loggingOut && item.id === "logout"}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 bg-bg-primary border border-border-primary transition-colors duration-200 text-left ${
                item.id === "logout" ? "hover:bg-red-50 hover:text-red-600" : ""
              } ${loggingOut && item.id === "logout" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`${
                  item.id === "logout" ? "text-red-500" : "text-gray-600"
                }`}
              >
                {loggingOut && item.id === "logout" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  item.icon
                )}
              </div>
              <span
                className={`font-medium ${
                  item.id === "logout" ? "text-red-600" : "text-gray-900"
                }`}
              >
                {item.label}
              </span>
              {item.count && (
                <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
