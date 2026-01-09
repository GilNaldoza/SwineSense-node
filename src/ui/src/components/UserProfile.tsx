import { Edit2, UserCheck, Briefcase, GraduationCap, Mail, Hash, Building2, Clock, CheckCircle2 } from "lucide-react";

interface UserData {
  first_name: string;
  last_name: string;
  email?: string;
  user_type: 'student' | 'faculty';
  college?: string;
  department?: string;
  year_level?: string;
  id_number: string;
  status: 'active' | 'inactive';
}

interface UserProfileProps {
  uid: string;
  data: UserData;
  onEdit: () => void;
  autoResetDuration?: number;
}

export function UserProfile({ uid, data, onEdit, autoResetDuration }: UserProfileProps) {
  const isActive = data.status === 'active';
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Auto-reset progress bar */}
      {autoResetDuration && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 z-20 animate-shrink" style={{ 
          width: '100%', 
          animation: `shrink ${autoResetDuration}ms linear forwards` 
        }} />
      )}
      
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative z-10">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
              <div className="relative w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl">
                <UserCheck size={48} strokeWidth={2} />
              </div>
              {/* Status badge */}
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center ${
                isActive ? 'bg-green-500' : 'bg-slate-400'
              }`}>
                <CheckCircle2 size={14} className="text-white" />
              </div>
            </div>
          </div>
          
          {/* Name and Type */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">{data.first_name} {data.last_name}</h2>
            <div className="flex items-center justify-center gap-2">
              {data.user_type === 'faculty' ? (
                <Briefcase size={16} className="text-white/90" />
              ) : (
                <GraduationCap size={16} className="text-white/90" />
              )}
              <span className="text-sm font-medium text-white/90 capitalize">{data.user_type}</span>
              {data.year_level && (
                <>
                  <span className="text-white/50">•</span>
                  <span className="text-sm text-white/80">Year {data.year_level}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Contact Information */}
        {data.email && (
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm text-slate-700 break-all">{data.email}</p>
            </div>
          </div>
        )}

        {/* Academic Information */}
        <div className="space-y-3">
          {data.college && (
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-100">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Building2 size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">College</p>
                <p className="text-sm font-medium text-slate-800">{data.college}</p>
                {data.department && (
                  <p className="text-xs text-slate-600 mt-1">{data.department}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ID Information Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Hash size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Number</p>
            </div>
            <p className="font-mono text-sm font-semibold text-slate-800">{data.id_number}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Card UID</p>
            </div>
            <p className="font-mono text-xs font-semibold text-slate-800 truncate" title={uid}>{uid}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <Clock size={14} className="text-slate-400" />
          <span className="text-xs text-slate-600">
            {isActive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Active User
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                Inactive
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-6 pt-0">
        <button
          onClick={onEdit}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Edit2 size={18} />
          Edit Profile
        </button>
      </div>
    </div>
  );
}
