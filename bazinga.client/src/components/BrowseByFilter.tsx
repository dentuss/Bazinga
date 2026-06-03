import { useState } from "react";
import { cn } from "@/lib/utils";

interface BrowseByFilterProps {
  onFilterChange?: (type: string, value: string) => void;
  seriesOptions: string[];
  characterOptions: string[];
  creatorOptions: string[];
}

const BrowseByFilter = ({
  onFilterChange,
  seriesOptions,
  characterOptions,
  creatorOptions,
}: BrowseByFilterProps) => {
  const [activeTab, setActiveTab] = useState("series");
  const [selectedValue, setSelectedValue] = useState("");

  const tabs = [
    { id: "series", label: "SERIES" },
    { id: "character", label: "CHARACTER" },
    { id: "creator", label: "CREATOR" },
  ];

  const getOptions = () => {
    switch (activeTab) {
      case "series":
        return seriesOptions;
      case "character":
        return characterOptions;
      case "creator":
        return creatorOptions;
      default:
        return [];
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedValue("");
    onFilterChange?.(tabId, "");
  };

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    onFilterChange?.(activeTab, value);
  };

  const options = getOptions();

  return (
    <div className="flex flex-col items-center gap-5 my-8">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground mr-4">BROWSE BY</span>
        <div className="flex gap-1 bg-muted rounded-md p-1 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative px-6 py-2 text-sm font-bold rounded transition-all duration-200",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-md scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:scale-[1.02]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-5xl px-4 max-h-40 overflow-y-auto py-1">
        {options.map((option) => {
          const isSelected = selectedValue === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleValueChange(option === selectedValue ? "" : option)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 border",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/40 scale-105"
                  : "bg-transparent text-foreground border-border hover:border-primary/80 hover:text-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BrowseByFilter;
