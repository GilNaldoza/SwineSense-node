import { ScanLine, Loader2, Radio } from "lucide-react";

interface StatusDisplayProps {
  status: 'idle' | 'scanning';
}

export function StatusDisplay({ status }: StatusDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
      {status === 'scanning' ? (
        <div className="relative mb-8">
          {/* Outer pulsing ring */}
          <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-60"></div>
          {/* Middle ring */}
          <div className="absolute inset-0 bg-blue-300 rounded-full animate-pulse opacity-40 scale-75"></div>
          {/* Inner ring */}
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse opacity-30 scale-50"></div>
          {/* Main circle */}
          <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-blue-200">
            <Loader2 size={56} className="animate-spin text-white" strokeWidth={2.5} />
          </div>
          {/* Scanning indicator dots */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      ) : (
        <div className="relative mb-8">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
          {/* Main icon circle */}
          <div className="relative w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center border-4 border-slate-200 shadow-lg group-hover:border-blue-300 transition-all duration-300 hover:scale-110">
            <div className="relative">
              <ScanLine size={64} strokeWidth={1.5} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
              {/* RF waves animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Radio size={80} strokeWidth={1} className="text-blue-200/30 animate-pulse" />
              </div>
            </div>
          </div>
          {/* Ready indicator */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="px-3 py-1 bg-green-100 border border-green-200 rounded-full">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-green-700">READY</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-slate-800">
          {status === 'scanning' ? "Reading Card..." : "Ready to Scan"}
        </h3>
        <p className="text-slate-500 mt-2 max-w-sm text-sm leading-relaxed">
          {status === 'scanning' 
            ? "Please hold the card near the reader" 
            : "Place an RFID card on the reader to identify user"}
        </p>
      </div>

      {status === 'idle' && (
        <div className="mt-8 pt-6 border-t border-slate-200 w-full max-w-xs">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Radio size={14} />
            <span>Waiting for RFID signal...</span>
          </div>
        </div>
      )}
    </div>
  );
}
