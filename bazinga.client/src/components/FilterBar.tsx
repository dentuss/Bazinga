import { useState } from "react";
import { Button } from "@/components/ui/button";

const FilterBar = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const filterCategories = ["RELEASE CALENDAR", "BAZINGA UNLIMITED", "STORMBREAKERS", "READING GUIDES", "ALL COMICS"];

  return (
    <div className="border-b border-border bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-8 py-4 flex-wrap">
          {filterCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category.toLowerCase().replace(/\s+/g, '-'))}
              className={`text-sm font-bold tracking-wide transition-colors hover:text-primary ${
                activeFilter === category.toLowerCase().replace(/\s+/g, '-')
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-foreground/70'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
