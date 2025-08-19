import React from "react";
import { ThemeProvider } from "../../contexts/ThemeContext";
import ChatWidget from "../../../components/ChatWidget";

interface PlanningSystemLayoutProps {
  children: React.ReactNode;
}

const PlanningSystemLayout: React.FC<PlanningSystemLayoutProps> = ({
  children,
}) => {
  return (
    <ThemeProvider>
      {children}
      <ChatWidget />
    </ThemeProvider>
  );
};

export default PlanningSystemLayout;
