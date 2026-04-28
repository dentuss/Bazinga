import { useState } from "react";

interface BrowseByFilterProps {
  onFilterChange?: (type: string, value: string) => void;
  seriesOptions: string[];
  characterOptions: string[];
  creatorOptions: string[];
}

const BrowseByFilter = ({ onFilterChange, seriesOptions, characterOptions, creatorOptions }: BrowseByFilterProps) => {
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

  return (
    <div className="flex flex-col items-center gap-4 my-8">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground mr-4">BROWSE BY</span>
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-6 py-2 text-sm font-bold rounded transition-all ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
        {getOptions().map((option) => (
          <button
            key={option}
            onClick={() => handleValueChange(option === selectedValue ? "" : option)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all border ${
              selectedValue === option
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-foreground border-border hover:border-primary hover:text-primary'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BrowseByFilter;
