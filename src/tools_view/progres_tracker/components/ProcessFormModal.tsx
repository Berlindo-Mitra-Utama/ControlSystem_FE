"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { X, Save } from "lucide-react";

interface Process {
  id: string;
  name: string;
  completed: boolean;
  notes?: string;
  children?: Process[];
  evidence?: any[];
}

interface ProcessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (processData: { name: string; notes?: string; completed: boolean }) => void;
  process?: Process | null;
  title: string;
  isSubProcess?: boolean;
}

export function ProcessFormModal({ isOpen, onClose, onSave, process, title, isSubProcess = false }: ProcessFormModalProps) {
  const [name, setName] = useState(process?.name || "");
  const [notes, setNotes] = useState(process?.notes || "");
  const [completed, setCompleted] = useState(process?.completed || false);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      notes: notes.trim() || undefined,
      completed,
    });

    // Reset form
    setName("");
    setNotes("");
    setCompleted(false);
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setName(process?.name || "");
    setNotes(process?.notes || "");
    setCompleted(process?.completed || false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[92vw] max-w-sm sm:max-w-md bg-gray-800 border-gray-700 text-white mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-300">
              {isSubProcess ? "Sub-Process" : "Process"} Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${isSubProcess ? "sub-process" : "process"} name`}
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-300">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes or description"
              rows={3}
              className="mt-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <Label htmlFor="completed" className="text-sm font-medium text-gray-300">
              Mark as completed
            </Label>
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
            disabled={!name.trim()}
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