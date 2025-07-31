import React from "react";
import { ThemeProvider } from "../../contexts/ThemeContext";

interface PlanningSystemLayoutProps {
  children: React.ReactNode;
}

const PlanningSystemLayout: React.FC<PlanningSystemLayoutProps> = ({
  children,
}) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

export default PlanningSystemLayout;
