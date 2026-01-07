import { Edit2, UserCheck, Briefcase, GraduationCap } from "lucide-react";

interface UserProfileProps {
  uid: string;
  data: any;
  onEdit: () => void;
  autoResetDuration?: number;
}

export function UserProfile({ uid, data, onEdit, autoResetDuration }: UserProfileProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 w-full max-w-md text-center overflow-hidden relative">
      {autoResetDuration && (
        <div className="absolute top-0 left-0 h-1 bg-green-500 z-10 animate-shrink" style={{ 
          width: '100%', 
          animation: `shrink ${autoResetDuration}ms linear forwards` 
        }} />
      )}
      <div className="p-6">
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 border border-green-100">
        <UserCheck size={40} />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 mb-1">{data.first_name} {data.last_name}</h2>
      <p className="text-slate-500 mb-1">{data.email}</p>
      
      <div className="flex flex-col items-center gap-1 text-sm text-slate-600 mb-6">
          <div className="flex items-center gap-1">
            {data.user_type === 'faculty' ? <Briefcase size={14} /> : <GraduationCap size={14} />}
            <span className="capitalize">{data.user_type}</span>
          </div>
          <div className="text-xs text-slate-500">
             {data.college}
          </div>
          {data.department && (
             <div className="font-medium text-slate-700">
                 {data.department}
             </div>
          )}
      </div>

      <div className="bg-slate-50 rounded-lg p-3 mb-6 border border-slate-100 grid grid-cols-2 gap-4">
        <div>
           <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">ID Number</p>
           <p className="font-mono text-slate-700 text-sm">{data.id_number}</p>
        </div>
        <div>
           <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Card UID</p>
           <p className="font-mono text-slate-700 text-sm truncate">{uid}</p>
        </div>
      </div>

      <button
        onClick={onEdit}
        className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Edit2 size={16} />
        Edit Profile
      </button>
      </div>
    </div>
  );
}
