"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "process" | "subprocess" | "part";
  name?: string;
}

export function DeleteConfirmationDialog({ isOpen, onClose, onConfirm, type, name }: DeleteConfirmationDialogProps) {
  const getTypeText = () => {
    switch (type) {
      case "part":
        return "part";
      case "process":
        return "process";
      case "subprocess":
        return "sub-process";
      default:
        return "item";
    }
  };

  const getWarningText = () => {
    switch (type) {
      case "process":
        return " This will also delete all its sub-processes.";
      case "part":
        return " This will also delete all its processes and sub-processes.";
      default:
        return "";
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="bg-gray-800 border-gray-700 text-white max-w-sm sm:max-w-md mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-400 text-base sm:text-lg">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            Confirm Deletion
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 text-sm sm:text-base">
            Are you sure you want to delete the {getTypeText()} "{name}"?
            {getWarningText()}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 