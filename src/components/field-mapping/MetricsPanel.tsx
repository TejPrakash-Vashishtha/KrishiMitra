import React from "react";
import { Check, Save, ShieldAlert, Trash2, Download, Share2 } from "lucide-react";
import { FieldMetrics, getLocalLandUnit } from "../../lib/geometryUtils";
import { useAuth } from "../../contexts/AuthContext";

interface MetricsPanelProps {
  pointsLength: number;
  validationError: string | null;
  metrics: FieldMetrics;
  isSyncing: boolean;
  savedSuccess: boolean;
  
  fieldName: string; setFieldName: (v: string) => void;
  village: string; setVillage: (v: string) => void;
  khasraNo: string; setKhasraNo: (v: string) => void;
  crop: string; setCrop: (v: string) => void;
  
  savePlotToDB: () => void;
  savedFields: any[];
  loadField: (field: any) => void;
  deleteFieldData: (id: string) => void;
  
  satelliteData?: any;
  isFetchingSatellite?: boolean;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  pointsLength, validationError, metrics, isSyncing, savedSuccess,
  fieldName, setFieldName, village, setVillage, khasraNo, setKhasraNo, crop, setCrop,
  savePlotToDB, savedFields, loadField, deleteFieldData,
  satelliteData, isFetchingSatellite
}) => {
  const { user } = useAuth();
  
  return (
    <div className="lg:col-span-4 space-y-4 sm:space-y-5">
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Metrics & Details</h3>
        <div>
          <span className="text-xs text-slate-400 block">Measured Area</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-0.5">{metrics.acres} <span className="text-base font-semibold text-slate-500">Acres</span></div>
          <div className="text-xs text-slate-500 mt-1">{metrics.hectares} Hectares &bull; {getLocalLandUnit(metrics.acres, user?.state || "Odisha")}</div>
        </div>
        
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase">Plot Name</label>
               <input type="text" value={fieldName} onChange={e => setFieldName(e.target.value)} placeholder="e.g. Plot A" className="w-full text-sm border-b border-slate-200 focus:border-emerald-500 focus:outline-none py-1" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase">Village</label>
               <input type="text" value={village} onChange={e => setVillage(e.target.value)} placeholder="Village name" className="w-full text-sm border-b border-slate-200 focus:border-emerald-500 focus:outline-none py-1" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase">Khasra / Khata No.</label>
               <input type="text" value={khasraNo} onChange={e => setKhasraNo(e.target.value)} placeholder="Land record ID" className="w-full text-sm border-b border-slate-200 focus:border-emerald-500 focus:outline-none py-1" />
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase">Current Crop</label>
               <input type="text" value={crop} onChange={e => setCrop(e.target.value)} placeholder="e.g. Wheat" className="w-full text-sm border-b border-slate-200 focus:border-emerald-500 focus:outline-none py-1" />
             </div>
          </div>
        </div>

        <button
          onClick={savePlotToDB}
          disabled={pointsLength < 3 || !!validationError || isSyncing}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {isSyncing ? <span className="animate-pulse">Saving securely...</span> : savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? "Saved to Cloud!" : "Save & Verify Plot"}</span>
        </button>
      </div>

      {/* Phase 4: Sentinel-2 Satellite Data Block */}
      {(satelliteData || isFetchingSatellite) && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
           <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Sentinel-2 Satellite Intelligence</span>
              {isFetchingSatellite && <span className="text-[10px] text-slate-400 animate-pulse">Syncing...</span>}
           </h3>
           
           {isFetchingSatellite ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-2">
                 <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-xs text-slate-500">Contacting Copernicus Data Space...</span>
              </div>
           ) : satelliteData && (
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                       <span className="text-[10px] font-bold text-emerald-700 block uppercase">Mean NDVI</span>
                       <span className="text-xl font-extrabold text-emerald-900">{satelliteData.meanNdvi}</span>
                       <span className="text-[9px] text-emerald-600 block mt-1">Last clear image: {satelliteData.lastClearImageDate?.split("T")[0] || "Unknown"}</span>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                       <span className="text-[10px] font-bold text-blue-700 block uppercase">Soil Moisture</span>
                       <span className="text-xl font-extrabold text-blue-900">{satelliteData.soilMoisture.value}%</span>
                       <span className="text-[9px] text-blue-600 block mt-1">{satelliteData.soilMoisture.label}</span>
                    </div>
                 </div>

                 {satelliteData.qualityNote && (
                    <div className={`p-2.5 rounded-lg text-[10px] font-bold border ${satelliteData.isTinyPlot ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                       {satelliteData.qualityNote}
                    </div>
                 )}

                 <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">NDVI 5-Week Trend (Cloud Gaps Filtered)</span>
                    <div className="flex items-end justify-between h-16 gap-1">
                       {satelliteData.trendChart.map((point: any, idx: number) => (
                          <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative">
                             {point.status === "CLOUDY" ? (
                                <div className="w-full h-full border border-dashed border-slate-300 bg-slate-50 rounded-t-sm flex items-center justify-center">
                                   <span className="text-[8px] text-slate-400 rotate-90">Cloudy</span>
                                </div>
                             ) : (
                                <div 
                                   className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm transition-all group-hover:opacity-80" 
                                   style={{ height: `${(point.ndvi / 1.0) * 100}%` }}
                                ></div>
                             )}
                             <span className="text-[8px] text-slate-400 mt-1">{point.date.substring(5)}</span>
                             <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[10px] py-0.5 px-2 rounded whitespace-nowrap z-50 pointer-events-none transition-opacity">
                                {point.status === "CLOUDY" ? "Cloudy: Interpolated" : `NDVI: ${point.ndvi.toFixed(2)}`}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex justify-between items-center">
           <span>My Saved Plots ({savedFields.length})</span>
           <span title="Your data is private and owned by you."><ShieldAlert className="w-3.5 h-3.5 text-slate-400" /></span>
        </h3>
        
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
           {savedFields.length === 0 ? (
              <div className="text-xs text-slate-500 italic text-center py-4">No plots saved yet.</div>
           ) : savedFields.map(f => (
              <div key={f.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-200 transition-colors cursor-pointer group" onClick={() => loadField(f)}>
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="text-sm font-bold text-slate-800">{f.name}</div>
                       <div className="text-[10px] text-slate-500 mt-0.5">{f.village ? `${f.village} • ` : ""}{(f.areaSqm/4046.86).toFixed(2)} Acres</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => { 
                          e.stopPropagation(); 
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(f.geoJson);
                          const downloadAnchorNode = document.createElement('a');
                          downloadAnchorNode.setAttribute("href", dataStr);
                          downloadAnchorNode.setAttribute("download", `${f.name.replace(/\s+/g, '_')}_plot.geojson`);
                          document.body.appendChild(downloadAnchorNode);
                          downloadAnchorNode.click();
                          downloadAnchorNode.remove();
                       }} className="text-slate-400 hover:text-emerald-600 p-1" title="Download GeoJSON">
                          <Download className="w-4 h-4" />
                       </button>
                       <button onClick={(e) => {
                          e.stopPropagation();
                          const text = `Check out my farm plot: ${f.name} (${(f.areaSqm/4046.86).toFixed(2)} Acres) in ${f.village || "my village"}.`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                       }} className="text-slate-400 hover:text-emerald-600 p-1" title="Share via WhatsApp">
                          <Share2 className="w-4 h-4" />
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); deleteFieldData(f.id); }} className="text-rose-400 hover:text-rose-600 p-1" title="Delete Plot">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};
