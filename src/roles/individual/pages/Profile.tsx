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
  Plus,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewService } from "@/services/reviewService";
import { FavoriteService } from "@/services/favoriteService";
import { BusinessService, type Business } from "@/services/businessService";
import { toast } from "sonner";
import CreateBusinessModal from "@/components/business/CreateBusinessModal";

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
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [userBusiness, setUserBusiness] = useState<Business | null>(null);
  const [showCreateBusinessModal, setShowCreateBusinessModal] = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(false);
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();

  // Load user stats and business
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

    const checkUserBusiness = async () => {
      if (!profile?.id) return;

      try {
        setCheckingBusiness(true);
        const businesses = await BusinessService.getBusinessesByOwner(profile.id);
        if (businesses && businesses.length > 0) {
          setUserBusiness(businesses[0]); // Get the first business
        }
      } catch (error) {
        console.error('Error checking business:', error);
      } finally {
        setCheckingBusiness(false);
      }
    };

    loadStats();
    checkUserBusiness();
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

  const handleMyBusinessPage = async (): Promise<void> => {
    if (!profile?.id) {
      toast.error("Please log in to view your business page");
      return;
    }

    if (userBusiness) {
      // Navigate to existing business
      navigate(`/business/${userBusiness.id}`);
    } else {
      // No business yet, show create modal
      setShowCreateBusinessModal(true);
    }
  };

  const handleCreateBusiness = (): void => {
    setShowCreateBusinessModal(true);
  };

  const handleBusinessCreated = async (businessId: string): Promise<void> => {
    // Refresh the user's business data
    try {
      const businesses = await BusinessService.getBusinessesByOwner(profile!.id);
      if (businesses && businesses.length > 0) {
        setUserBusiness(businesses[0]);
      }
      
      // Navigate to the newly created business page
      navigate(`/business/${businessId}`);
    } catch (error) {
      console.error("Error loading business after creation:", error);
      toast.error("Business created but failed to load. Please refresh the page.");
    }
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
      <div className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 bg-bg-primary border border-border-primary p-4 sm:p-6 rounded-lg">
          {/* Profile Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profileData.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-600 text-xl sm:text-2xl font-bold">
                {profileData.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 truncate">
              {profileData.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-3">{profileData.bio}</p>

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-600 mb-4 flex-wrap gap-2">
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
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
              {checkingBusiness ? (
                <Button 
                  size="sm" 
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  disabled
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </Button>
              ) : userBusiness ? (
                <Button 
                  onClick={handleMyBusinessPage} 
                  size="sm" 
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  My Business Page
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateBusiness} 
                  size="sm" 
                  className="w-full sm:w-auto text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Business
                </Button>
              )}
              <Button onClick={handlePlanMyDay} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                Plan My Day
              </Button>
              <Button onClick={handleEditProfile} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                Edit Profile
              </Button>
            </div>

            {/* Profile Completion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">
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

      {/* Business Info Section - Only show if user has a business */}
      {userBusiness && (
        <div className="p-3 sm:p-4 md:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">My Business</h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  {userBusiness.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{userBusiness.category}</p>
                {userBusiness.description && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {userBusiness.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                    {userBusiness.rating.toFixed(1)} ({userBusiness.total_reviews} reviews)
                  </span>
                  {userBusiness.verified && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <Button 
                  onClick={() => navigate(`/business/${userBusiness.id}`)} 
                  size="sm" 
                  className="mt-4 text-xs sm:text-sm"
                  variant="outline"
                >
                  View Business Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Section */}
      <div className="p-3 sm:p-4 md:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Favorites</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {favoriteMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={`p-3 sm:p-4 rounded-lg border border-border-primary bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 text-center ${
                activeSection === item.id
                  ? "ring-2 ring-blue-500 border-blue-500"
                  : ""
              }`}
            >
              <div className="flex flex-col items-center space-y-1 sm:space-y-2">
                <div className="text-gray-600 relative">
                  {item.icon}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                  {item.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Section */}
      <div className="p-3 sm:p-4 md:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Settings</h2>
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
              className={`w-full flex items-center space-x-3 p-3 sm:p-4 rounded-lg hover:bg-gray-50 active:bg-gray-100 bg-bg-primary border border-border-primary transition-colors duration-200 text-left ${
                item.id === "logout" ? "hover:bg-red-50 hover:text-red-600" : ""
              } ${loggingOut && item.id === "logout" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`flex-shrink-0 ${
                  item.id === "logout" ? "text-red-500" : "text-gray-600"
                }`}
              >
                {loggingOut && item.id === "logout" ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  item.icon
                )}
              </div>
              <span
                className={`font-medium text-sm sm:text-base ${
                  item.id === "logout" ? "text-red-600" : "text-gray-900"
                }`}
              >
                {item.label}
              </span>
              {item.count && (
                <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 sm:px-2.5 py-0.5 rounded-full flex-shrink-0">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Create Business Modal */}
      <CreateBusinessModal
        isOpen={showCreateBusinessModal}
        onClose={() => setShowCreateBusinessModal(false)}
        onSuccess={handleBusinessCreated}
      />
    </div>
  );
};

export default Profile;
