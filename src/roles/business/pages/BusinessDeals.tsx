import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/context/ToastContext";
import { Percent, Calendar, FileText } from "lucide-react";

const BusinessDeals = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [deals, setDeals] = useState(dealsCard);
  const [newDeal, setNewDeal] = useState({
    deals: "",
    discount: "",
    validity: "",
    description: "",
  });
  const { showToast } = useToast();

  const handleAddDeal = () => {
    if (!newDeal.deals || !newDeal.discount || !newDeal.validity) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const dealToAdd = {
      id: deals.length + 1,
      ...newDeal,
      status: "Active",
    };

    setDeals([...deals, dealToAdd]);
    setNewDeal({ deals: "", discount: "", validity: "", description: "" });
    setShowAddModal(false);
    showToast("Deal added successfully!", "success");
  };

  const handleViewDetails = (deal: any) => {
    setSelectedDeal(deal);
    setShowDetailsModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      <div className="flex justify-between">
        <h3 className="font-bold">My Deals & Promos</h3>
        <Button onClick={() => setShowAddModal(true)}>Add New</Button>
      </div>
      <div className="mt-8 flex flex-col gap-4">
        {deals.map((item) => (
          <div
            className="bg-white border-1 border-border-primary rounded-md w-full p-6 flex items-center justify-between"
            key={item.id}
          >
            <div className="flex flex-col gap-2">
              <h4 className="font-bold">{item.deals}</h4>
              <p className="text-base">Valid Until: {item.validity}</p>
              <p className="text-base">Status: {item.status}</p>
            </div>
            <Button onClick={() => handleViewDetails(item)}>View Details</Button>
          </div>
        ))}
      </div>

      {/* Add Deal Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dealTitle">Deal Title</Label>
              <Input
                id="dealTitle"
                value={newDeal.deals}
                onChange={(e) => setNewDeal({ ...newDeal, deals: e.target.value })}
                placeholder="Enter deal title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
                value={newDeal.discount}
                onChange={(e) => setNewDeal({ ...newDeal, discount: e.target.value })}
                placeholder="e.g. 20% off"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="validity">Valid Until</Label>
              <Input
                id="validity"
                type="date"
                value={newDeal.validity}
                onChange={(e) => setNewDeal({ ...newDeal, validity: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dealDescription">Description</Label>
              <textarea
                id="dealDescription"
                value={newDeal.description}
                onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                placeholder="Enter deal description"
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bg-primary-dark2 focus:border-transparent resize-vertical"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddDeal} className="flex-1 bg-green-600 hover:bg-green-700">
                Save Deal
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deal Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          {selectedDeal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedDeal.deals}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Percent className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="font-medium">Discount:</span>
                    <span className="ml-2">{selectedDeal.discount}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="font-medium">Valid Until:</span>
                    <span className="ml-2">{selectedDeal.validity}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${selectedDeal.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-2">{selectedDeal.status}</span>
                  </div>
                </div>
                {selectedDeal.description && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="mt-1 text-gray-600">{selectedDeal.description}</p>
                    </div>
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

const dealsCard = [
  {
    id: 1,
    deals: "30% Off Spa Treatment",
    validity: "Aug 10, 2025",
    status: "Active",
  },
  {
    id: 2,
    deals: "Buy 1 Get 1 Free - Manicure",
    validity: "Aug 18, 2025",
    status: "Active",
  },
];

export default BusinessDeals;
