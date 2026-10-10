import React from "react";
import { Search, Navigation, MapPin, Footprints } from "lucide-react";

interface MapToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  onSearchResultClick: (res: any) => void;
  locateMe: () => void;
  addPointHere: () => void;
  toggleWalkBoundary: () => void;
  isWalking: boolean;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  searchQuery, setSearchQuery, searchResults, onSearchResultClick,
  locateMe, addPointHere, toggleWalkBoundary, isWalking
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-100 text-xs font-semibold relative z-20">
      <div className="relative w-full sm:w-64">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input 
           type="text" 
           aria-label="Search village or district"
           placeholder="Search village or district..." 
           value={searchQuery} 
           onChange={e => setSearchQuery(e.target.value)} 
           className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
        />
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden" role="listbox">
             {searchResults.map(res => (
                <div key={res.place_id} role="option" aria-selected="false" tabIndex={0} onKeyDown={(e) => { if(e.key==='Enter') onSearchResultClick(res); }} onClick={() => onSearchResultClick(res)} className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 truncate">
                   {res.display_name}
                </div>
             ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        <button onClick={locateMe} aria-label="Locate me using GPS" className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 whitespace-nowrap flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5"/> Locate Me
        </button>
        <button onClick={addPointHere} aria-label="Drop a point at current GPS location" className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 inline"/> Drop Point
        </button>
        <button onClick={toggleWalkBoundary} aria-pressed={isWalking} aria-label={isWalking ? "Stop walking boundary" : "Start walking boundary"} className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold flex items-center gap-1 border transition-colors ${isWalking ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}>
           <Footprints className="w-3.5 h-3.5" /> {isWalking ? "Stop Walking" : "Walk Boundary"}
        </button>
      </div>
    </div>
  );
};
