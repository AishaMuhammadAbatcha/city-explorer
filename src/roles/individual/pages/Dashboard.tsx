import { useState, useEffect } from "react";
import { Search, MapPin, Pizza, Store, TrendingUp, Users, Calendar, Star } from "lucide-react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessService, type Business } from "@/services/businessService";
import { EventService } from "@/services/eventService";
import { FavoriteService } from "@/services/favoriteService";
import { ReviewService } from "@/services/reviewService";
import { usePersonalizedRecommendations, useTrendingPlaces, useCurrentContext, useLocationForRecommendations } from "@/hooks/useRecommendations";
import RecommendationsCard from "@/components/recommendations/RecommendationsCard";
import PlaceDetails from "@/components/places/PlaceDetails";
import type { RecommendationScore } from "@/services/recommendationsService";
import ResponsiveContainer, { ResponsiveGrid, TouchOptimizedButton } from "@/components/layout/ResponsiveContainer";
import { useBreakpoints } from "@/lib/responsive";


const categories = [
  {
    id: 1,
    name: "All",
    active: true,
    color: "bg-bg-primary-dark2",
  },
  { id: 2, name: "Dining", active: false, color: "bg-bg-primary-dark2" },
  { id: 3, name: "Services", active: false, color: "bg-bg-primary-dark2" },
  { id: 4, name: "Events", active: false, color: "bg-bg-primary-dark2" },
  { id: 5, name: "Shopping", active: false, color: "bg-bg-primary-dark2" },
  { id: 6, name: "Auto", active: false, color: "bg-bg-primary-dark2" },
];

// const bottomCategories = [
//   {
//     id: 1,
//     icon: <Wrench className="w-6 h-6" />,
//     name: "Auto repairs",
//     color: "bg-purple-500",
//   },
//   {
//     id: 2,
//     icon: <Pizza className="w-6 h-6" />,
//     name: "Takeout",
//     color: "bg-orange-500",
//   },
//   {
//     id: 3,
//     icon: <Coffee className="w-6 h-6" />,
//     name: "Smoothies",
//     color: "bg-teal-400",
//   },
//   {
//     id: 4,
//     icon: <ShoppingCart className="w-6 h-6" />,
//     name: "Shopping",
//     color: "bg-purple-400",
//   },
// ];

const Dashboard = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    favoriteCount: 0,
    reviewCount: 0,
    eventCount: 0,
  });
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationScore | null>(null);
  const [showPlaceDetails, setShowPlaceDetails] = useState(false);

  const { profile } = useAuth();
  const navigate = useNavigate();
  const currentContext = useCurrentContext();
  const { location } = useLocationForRecommendations();
  const { isMobile } = useBreakpoints();

  // AI Recommendations hooks
  const {
    recommendations: personalizedRecs,
    loading: personalizedLoading,
    error: personalizedError,
    refresh: refreshPersonalized
  } = usePersonalizedRecommendations({ limit: 6 });

  const {
    recommendations: trendingRecs,
    loading: trendingLoading,
    error: trendingError,
    refresh: refreshTrending
  } = useTrendingPlaces(location || undefined, 6);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load businesses
      const businessData = await BusinessService.getBusinesses({
        limit: 6,
        verified: true
      });
      setBusinesses(businessData || []);

      // Load user stats if authenticated
      if (profile) {
        const [favoriteCount, userReviews, userEvents] = await Promise.all([
          FavoriteService.getUserFavoritesCount(),
          ReviewService.getReviewsByUser(profile.id),
          EventService.getEvents({ limit: 100 }) // Get events to count attended ones
        ]);

        setStats({
          favoriteCount,
          reviewCount: userReviews?.length || 0,
          eventCount: userEvents?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    if (activeCategory === "All") return true;
    return business.category === activeCategory;
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const searchResults = await BusinessService.searchBusinesses(searchQuery, {
        category: activeCategory === "All" ? undefined : activeCategory,
        limit: 10
      });
      setBusinesses(searchResults || []);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleRecommendationSelect = (recommendation: RecommendationScore) => {
    setSelectedRecommendation(recommendation);
    setShowPlaceDetails(true);
  };

  const handleCloseDetails = () => {
    setShowPlaceDetails(false);
    setSelectedRecommendation(null);
  };

  const dashboardStats = [
    {
      title: "Saved Places",
      value: stats.favoriteCount.toString(),
      icon: Star,
      change: "+3",
      changeType: "positive" as const,
    },
    {
      title: "Reviews Written",
      value: stats.reviewCount.toString(),
      icon: Users,
      change: `+${stats.reviewCount}`,
      changeType: "positive" as const,
    },
    {
      title: "Events Discovered",
      value: stats.eventCount.toString(),
      icon: Calendar,
      change: "+5",
      changeType: "positive" as const,
    },
    {
      title: "Cities Explored",
      value: "3",
      icon: TrendingUp,
      change: "+1",
      changeType: "positive" as const,
    },
  ];

  return (
    <ResponsiveContainer size="full" padding="md">
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="space-y-2 px-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            Good {currentContext === 'morning' ? 'morning' : currentContext === 'afternoon' ? 'afternoon' : 'evening'}, {profile?.full_name || 'Explorer'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome back! Here's what's happening in your city today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-emerald-600">{stat.change}</span> this month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Hero Search Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 sm:p-6 lg:p-8 text-primary-foreground">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                <div className="flex-1 space-y-3 sm:space-y-4">
                  <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold leading-tight">
                    Discover amazing places and events in your city
                  </h2>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder={isMobile ? "Search places..." : "Search for restaurants, events, services..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10 bg-background text-foreground text-base h-11 sm:h-12"
                      />
                    </div>
                    <TouchOptimizedButton
                      onClick={handleSearch}
                      className="bg-white text-primary hover:bg-gray-50 h-11 sm:h-12 px-6"
                      fullWidth={isMobile}
                    >
                      Search
                    </TouchOptimizedButton>
                  </div>
                </div>

                <div className="hidden lg:flex items-center justify-center lg:ml-6 xl:ml-8">
                  <div className="w-24 h-24 xl:w-32 xl:h-32 bg-background/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Pizza className="w-12 h-12 xl:w-16 xl:h-16" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* AI Recommendations Section */}
      <div className="space-y-6">
        <RecommendationsCard
          title="Just for You"
          subtitle={`AI-powered recommendations based on your preferences`}
          recommendations={personalizedRecs}
          loading={personalizedLoading}
          error={personalizedError}
          onPlaceSelect={handleRecommendationSelect}
          onRefresh={refreshPersonalized}
          type="personalized"
          maxItems={6}
        />

        <RecommendationsCard
          title="Trending Now"
          subtitle={`What's popular in your area right now`}
          recommendations={trendingRecs}
          loading={trendingLoading}
          error={trendingError}
          onPlaceSelect={handleRecommendationSelect}
          onRefresh={refreshTrending}
          type="trending"
          maxItems={6}
        />
      </div>

        {/* Category Filters */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl">Explore Categories</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Find what you're looking for</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
              {categories.map((category) => (
                <TouchOptimizedButton
                  key={category.name}
                  variant={activeCategory === category.name ? "primary" : "ghost"}
                  onClick={() => setActiveCategory(category.name)}
                  className="whitespace-nowrap flex-shrink-0 text-xs sm:text-sm snap-start"
                  size="sm"
                >
                  {category.name}
                </TouchOptimizedButton>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured Businesses */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl">Featured Businesses</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Popular places in your area</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-3 text-xs sm:text-sm">Loading businesses...</p>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted-foreground text-sm">No businesses found in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {filteredBusinesses.map((business) => (
                  <Card
                    key={business.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-[0.98] transform border border-border"
                    onClick={() => navigate(`/business/${business.id}`)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm sm:text-base leading-tight line-clamp-1">{business.name}</h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                                {business.category}
                              </Badge>
                              {business.verified && (
                                <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                                  ✓
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {business.description || "Discover what this business has to offer"}
                          </p>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground min-w-0 flex-1">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{business.city}</span>
                            </div>
                            {business.rating > 0 && (
                              <div className="flex items-center text-xs sm:text-sm flex-shrink-0 ml-2">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{business.rating.toFixed(1)}</span>
                                <span className="text-muted-foreground ml-1">
                                  ({business.total_reviews})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Place Details Modal */}
        <PlaceDetails
          place={selectedRecommendation?.place || null}
          isOpen={showPlaceDetails}
          onClose={handleCloseDetails}
        />
      </div>
    </ResponsiveContainer>
  );
};

export default Dashboard;
