"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { X, Save } from "lucide-react";

interface Part {
  id: string;
  partName: string;
  partNumber: string;
  customer: string;
  progress: any[];
}

interface PartFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (partData: { partName: string; partNumber: string; customer: string }) => void;
  part?: Part;
  title: string;
}

export function PartFormModal({ isOpen, onClose, onSave, part, title }: PartFormModalProps) {
  const [partName, setPartName] = useState(part?.partName || "");
  const [partNumber, setPartNumber] = useState(part?.partNumber || "");
  const [customer, setCustomer] = useState(part?.customer || "");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && part) {
      setPartName(part.partName);
      setPartNumber(part.partNumber);
      setCustomer(part.customer);
    } else if (isOpen) {
      setPartName("");
      setPartNumber("");
      setCustomer("");
    }
  }, [isOpen, part]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    onSave({
      partName: partName.trim(),
      partNumber: partNumber.trim(),
      customer: customer.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-sm sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="partName" className="text-sm font-medium text-gray-300">
              Part Name
            </Label>
            <Input
              id="partName"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="Enter part name"
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="partNumber" className="text-sm font-medium text-gray-300">
              Part Number
            </Label>
            <Input
              id="partNumber"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Enter part number"
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="customer" className="text-sm font-medium text-gray-300">
              Customer
            </Label>
            <Input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Enter customer name"
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!partName.trim() || !partNumber.trim() || !customer.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 