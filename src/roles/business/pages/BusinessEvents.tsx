import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/context/ToastContext";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BusinessService } from "@/services/businessService";
import { EventsService, type Event } from "@/services/eventsService";

const BusinessEvents = () => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start_date: "",
    end_date: "",
    location: "",
    description: "",
    category: "General",
  });
  const { showToast } = useToast();

  // Fetch business ID for the logged-in user
  useEffect(() => {
    const fetchBusinessId = async () => {
      if (!user) return;

      try {
        const businesses = await BusinessService.getBusinessesByOwner(user.id);
        if (businesses && businesses.length > 0) {
          setBusinessId(businesses[0].id);
        }
      } catch (error) {
        console.error("Error fetching business:", error);
      }
    };

    fetchBusinessId();
  }, [user]);

  // Fetch events for the business
  useEffect(() => {
    const fetchEvents = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        const data = await EventsService.getBusinessEvents(businessId);
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
        showToast("Failed to load events", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [businessId, showToast]);

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start_date || !newEvent.location) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!businessId) {
      showToast("Business not found. Please create a business profile first.", "error");
      return;
    }

    try {
      const eventData = {
        business_id: businessId,
        title: newEvent.title,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date || newEvent.start_date,
        location: newEvent.location,
        description: newEvent.description,
        category: newEvent.category,
      };

      const createdEvent = await EventsService.createEvent(eventData);
      setEvents([...events, createdEvent]);
      setNewEvent({
        title: "",
        start_date: "",
        end_date: "",
        location: "",
        description: "",
        category: "General",
      });
      setShowAddModal(false);
      showToast("Event added successfully!", "success");
    } catch (error: any) {
      console.error("Error adding event:", error);
      showToast(error.message || "Failed to add event", "error");
    }
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-bg-primary-dark2" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">My Events</h3>
        <Button onClick={() => setShowAddModal(true)}>Add New</Button>
      </div>

      {!businessId && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You need to create a business profile before you can add events.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {events.length === 0 ? (
          <div className="bg-white border-1 border-border-primary rounded-md w-full p-12 text-center">
            <p className="text-gray-500">No events yet. Create your first event!</p>
          </div>
        ) : (
          events.map((item) => (
            <div
              className="bg-white border-1 border-border-primary rounded-md w-full p-6 flex items-center justify-between"
              key={item.id}
            >
              <div className="flex flex-col gap-2">
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-base">Date: {formatDate(item.start_date)}</p>
                <p className="text-base">Location: {item.location}</p>
              </div>
              <Button onClick={() => handleViewDetails(item)}>View Details</Button>
            </div>
          ))
        )}
      </div>

      {/* Add Event Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="eventTitle">Event Title *</Label>
              <Input
                id="eventTitle"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Enter event title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="eventStartDate">Start Date *</Label>
              <Input
                id="eventStartDate"
                type="date"
                value={newEvent.start_date}
                onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="eventEndDate">End Date</Label>
              <Input
                id="eventEndDate"
                type="date"
                value={newEvent.end_date}
                onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="eventLocation">Location *</Label>
              <Input
                id="eventLocation"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Enter event location"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="eventCategory">Category</Label>
              <Input
                id="eventCategory"
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                placeholder="e.g., Music, Sports, Workshop"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="eventDescription">Description</Label>
              <textarea
                id="eventDescription"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Enter event description"
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bg-primary-dark2 focus:border-transparent resize-vertical"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddEvent} className="flex-1 bg-bg-primary-dark2 hover:bg-bg-primary-dark2/90">
                Save Event
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="font-medium">Date:</span>
                    <span className="ml-2">{formatDate(selectedEvent.start_date)}</span>
                    {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                      <span> - {formatDate(selectedEvent.end_date)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="font-medium">Location:</span>
                    <span className="ml-2">{selectedEvent.location}</span>
                  </div>
                </div>
                {selectedEvent.category && (
                  <div>
                    <span className="font-medium">Category:</span>
                    <span className="ml-2">{selectedEvent.category}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}
                {selectedEvent.capacity && (
                  <div>
                    <span className="font-medium">Capacity:</span>
                    <span className="ml-2">{selectedEvent.capacity} people</span>
                  </div>
                )}
                {selectedEvent.registered_count > 0 && (
                  <div>
                    <span className="font-medium">Registrations:</span>
                    <span className="ml-2">{selectedEvent.registered_count}</span>
                  </div>
                )}
                <div className="pt-4">
                  <Button onClick={() => setShowDetailsModal(false)} className="w-full">
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessEvents;
