import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useToast } from "@/context/ToastContext";

interface Interest {
  id: string;
  name: string;
  icon: string;
}

const interests: Interest[] = [
  { id: "dining", name: "Dining & Food", icon: "🍽️" },
  { id: "shopping", name: "Shopping", icon: "🛍️" },
  { id: "events", name: "Events & Entertainment", icon: "🎭" },
  { id: "health", name: "Health & Wellness", icon: "💪" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "culture", name: "Art & Culture", icon: "🎨" },
  { id: "hospitality", name: "Hospitality", icon: "🏨" },
  { id: "nightlife", name: "Nightlife", icon: "🌙" },
  { id: "outdoor", name: "Outdoor Activities", icon: "🏞️" },
  { id: "education", name: "Education", icon: "📚" },
];

const Interests: React.FC = () => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleConfirm = async () => {
    if (selectedInterests.length === 0) {
      showToast("Please select at least one interest", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Log the selected interests (in real app, this would be sent to backend)
      console.log("Selected interests:", selectedInterests);
      
      // Save to localStorage to prevent showing again
      localStorage.setItem("user_interests", JSON.stringify(selectedInterests));
      
      showToast("Interests saved successfully!", "success");
      navigate("/dashboard");
    } catch (error) {
      showToast("Failed to save interests", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-bg-primary-dark2 mb-2">TR-ACE</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Select Your Interests</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose from the options below to tailor your experience.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {interests.map((interest) => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                  selectedInterests.includes(interest.id)
                    ? "border-bg-primary-dark2 bg-bg-primary-dark2/10 text-bg-primary-dark2"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{interest.icon}</span>
                  <div>
                    <h3 className="font-medium">{interest.name}</h3>
                    {selectedInterests.includes(interest.id) && (
                      <span className="text-sm text-bg-primary-dark2">✓ Selected</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Selected: {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
            </p>
            <Button
              onClick={handleConfirm}
              loading={isSubmitting}
              disabled={isSubmitting || selectedInterests.length === 0}
              className="bg-bg-primary-dark2 hover:bg-bg-primary-dark2/90 px-8"
              size="lg"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interests;