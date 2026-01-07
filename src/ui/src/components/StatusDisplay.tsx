import { ScanLine, Loader2 } from "lucide-react";

interface StatusDisplayProps {
  status: 'idle' | 'scanning';
}

export function StatusDisplay({ status }: StatusDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
      {status === 'scanning' ? (
        <div className="relative">
             <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
             <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center relative border-2 border-blue-100 text-blue-600">
                <Loader2 size={48} className="animate-spin" />
             </div>
        </div>
       
      ) : (
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-2 border-slate-100 text-slate-400 mb-6 group hover:border-blue-200 hover:text-blue-500 transition-colors">
          <ScanLine size={48} strokeWidth={1.5} />
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-slate-700 mt-6">
        {status === 'scanning' ? "Reading Card..." : "Ready to Scan"}
      </h3>
      <p className="text-slate-400 mt-2 max-w-xs">
        {status === 'scanning' 
          ? "Please hold the card near the reader" 
          : "Place an RFID card on the reader to identify user"}
      </p>
    </div>
  );
}
