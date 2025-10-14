
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Phone, Mail, Globe, MapPin, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessService, type Business } from "@/services/businessService";
import { toast } from "sonner";
import EventsManagement from "@/components/business/EventsManagement";
import ReviewsManagement from "@/components/business/ReviewsManagement";

interface TabType {
  id: string;
  label: string;
}

const BusinessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const tabs: TabType[] = [
    { id: "overview", label: "Overview" },
    { id: "events", label: "Events" },
    { id: "reviews", label: "Reviews" },
  ];

  useEffect(() => {
    if (id) {
      loadBusiness();
    }
  }, [id]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const data = await BusinessService.getBusiness(id!);
      setBusiness(data as any);
    } catch (error) {
      console.error("Error loading business:", error);
      toast.error("Failed to load business details");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tabId: string): void => {
    setActiveTab(tabId);
  };

  const handleCallClick = (): void => {
    if (business?.phone) {
      window.open(`tel:${business.phone}`, "_self");
    }
  };

  const handleDirectionsClick = (): void => {
    if (business?.address && business?.city) {
      const address = encodeURIComponent(`${business.address}, ${business.city}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-700">Business Not Found</h2>
          <p className="text-gray-600">The business you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border-primary rounded-lg shadow-sm bg-bg-primary p-6">
      {/* Header Image */}
      <div className="relative h-48 bg-gradient-to-r from-amber-100 to-orange-100">
        {business.image_url ? (
          <img
            src={business.image_url}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🏢</span>
          </div>
        )}
      </div>

      {/* Business Info Header */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
          <div className="flex items-center space-x-4">
            {/* Business Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">
                {business.category === 'Dining' ? '🍔' : 
                 business.category === 'Shopping' ? '🛍️' : 
                 business.category === 'Services' ? '🔧' : 
                 business.category === 'Entertainment' ? '🎭' : 
                 business.category === 'Accommodation' ? '🏨' : '🏢'}
              </span>
            </div>

            {/* Business Details */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {business.name}
                </h1>
                {business.verified && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-gray-600">{business.category}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{business.rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({business.total_reviews} reviews)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {business.phone && (
              <Button onClick={handleCallClick}>
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </Button>
            )}
            <Button onClick={handleDirectionsClick}>
              <span>Get Directions</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-8 border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Description */}
              {business.description && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    About
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{business.description}</p>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Contact
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span>{business.address}, {business.city}</span>
                  </div>
                  {business.phone && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span>{business.email}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <a 
                        href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="bg-gray-100 rounded-lg overflow-hidden h-64">
              <div className="relative w-full h-full">
                {/* Mock Map with Location Pin */}
                <svg
                  viewBox="0 0 400 256"
                  className="w-full h-full"
                  style={{
                    background:
                      "linear-gradient(45deg, #e5f3e5 0%, #f0f8f0 50%, #e8f5e8 100%)",
                  }}
                >
                  {/* Map Grid Lines */}
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="1"
                        opacity="0.3"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Mock Streets */}
                  <line
                    x1="0"
                    y1="128"
                    x2="400"
                    y2="128"
                    stroke="#fbbf24"
                    strokeWidth="4"
                    opacity="0.8"
                  />
                  <line
                    x1="200"
                    y1="0"
                    x2="200"
                    y2="256"
                    stroke="#fbbf24"
                    strokeWidth="4"
                    opacity="0.8"
                  />
                  <line
                    x1="100"
                    y1="0"
                    x2="100"
                    y2="256"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <line
                    x1="300"
                    y1="0"
                    x2="300"
                    y2="256"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    opacity="0.6"
                  />

                  {/* Location Pin */}
                  <g transform="translate(200, 128)">
                    <circle
                      cx="0"
                      cy="-20"
                      r="15"
                      fill="#ea580c"
                      stroke="#fff"
                      strokeWidth="3"
                    />
                    <circle cx="0" cy="-20" r="6" fill="#fff" />
                    <path d="M 0 -5 L -8 8 L 8 8 Z" fill="#ea580c" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <EventsManagement businessId={business.id} />
        )}

        {activeTab === "reviews" && (
          <ReviewsManagement businessId={business.id} />
        )}
      </div>
    </div>
  );
};

export default BusinessPage;
