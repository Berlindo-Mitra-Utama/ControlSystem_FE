"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Progress } from "./progress";
import { Edit, Trash2 } from "lucide-react";

interface Part {
  id: string;
  partName: string;
  partNumber: string;
  customer: string;
  progress: any[];
}

interface PartHeaderProps {
  part: Part;
  overallProgress: number;
  onEdit: () => void;
  onDelete: () => void;
  uiColors: any;
}

export function PartHeader({ part, overallProgress, onEdit, onDelete, uiColors }: PartHeaderProps) {
  return (
    <Card className={`${uiColors.bg.card} ${uiColors.border.primary} shadow-lg`}>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-lg sm:text-xl md:text-2xl ${uiColors.text.primary} mb-2 sm:mb-3 break-words`}>
              {part.partName}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={`${uiColors.bg.secondary} ${uiColors.text.secondary} ${uiColors.border.secondary} text-xs sm:text-sm`}>
                {part.partNumber}
              </Badge>
              <Badge variant="outline" className={`${uiColors.bg.secondary} ${uiColors.text.secondary} ${uiColors.border.secondary} text-xs sm:text-sm`}>
                {part.customer}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="text-center sm:text-right order-2 sm:order-1">
              <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${uiColors.text.primary}`}>
                {overallProgress}%
              </div>
              <div className={`text-xs sm:text-sm ${uiColors.text.tertiary}`}>Overall Progress</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className={`${uiColors.text.secondary} hover:${uiColors.bg.secondary} ${uiColors.border.secondary} ${uiColors.bg.tertiary} text-xs px-2 py-1 h-7 sm:h-8`}
              >
                <Edit className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Edit Part</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                className={`${uiColors.text.error} hover:${uiColors.bg.secondary} ${uiColors.border.error} ${uiColors.bg.tertiary} text-xs px-2 py-1 h-7 sm:h-8`}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Delete Part</span>
                <span className="sm:hidden">Delete</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={overallProgress} className={`h-2 sm:h-3 ${uiColors.bg.secondary}`} />
        </div>
      </CardHeader>
    </Card>
  );
} 