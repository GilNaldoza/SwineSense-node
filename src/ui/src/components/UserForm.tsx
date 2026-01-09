import { useState, useMemo } from "react";
import { Save, X, UserPlus, UserCog, AlertCircle, GraduationCap, Briefcase, Mail, Hash, Building2 } from "lucide-react";
import { colleges, departmentsByCollege } from "../data/colleges";

interface UserFormData {
  firstName: string;
  lastName: string;
  idNumber: string;
  email: string;
  userType: 'student' | 'faculty';
  college: string;
  department: string;
  yearLevel: string;
  status: 'active' | 'inactive';
}

interface UserInitialData {
  first_name?: string;
  last_name?: string;
  id_number?: string;
  email?: string;
  user_type?: 'student' | 'faculty';
  college?: string;
  department?: string;
  year_level?: string;
  status?: 'active' | 'inactive';
}

interface UserFormProps {
  uid: string;
  initialData?: UserInitialData;
  isNewUser: boolean;
  onSave: (data: UserFormData) => void;
  onCancel: () => void;
}

export function UserForm({ uid, initialData, isNewUser, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    firstName: initialData?.first_name || "",
    lastName: initialData?.last_name || "",
    idNumber: initialData?.id_number || "",
    email: initialData?.email || "",
    userType: initialData?.user_type || "student",
    college: initialData?.college || "",
    department: initialData?.department || "",
    yearLevel: initialData?.year_level || "",
    status: initialData?.status || "active"
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        // Reset department if college changes
        if (name === 'college') {
            newData.department = "";
        }
        return newData;
    });
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const collegesWithoutDepartment = new Set([
      "College of Medicine",
      "Senior High School",
  ]);

  // Derived available departments based on selected college
  const availableDepartments = useMemo(() => {
    if (!formData.college) return [];
    if (collegesWithoutDepartment.has(formData.college)) return [];
    
    return departmentsByCollege[formData.college] || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.college]);

  const validate = (v: typeof formData) => {
    const newErrors: Record<string, string | undefined> = {};
    const idLabel = v.userType === 'faculty' ? "Faculty ID" : "ID Number";

    if (!v.idNumber?.trim()) newErrors.idNumber = `${idLabel} is required`;
    if (!v.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!v.lastName?.trim()) newErrors.lastName = "Last name is required";
    
    if (v.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(v.email.trim())) {
        newErrors.email = "Invalid email format";
      }
    }

    if (v.userType === 'student') {
      if (!v.college?.trim()) newErrors.college = "College is required";
      if (!v.yearLevel?.trim()) newErrors.yearLevel = "Year level is required";

      if (v.college && !collegesWithoutDepartment.has(v.college)) {
        const deptOptions = departmentsByCollege[v.college] ?? [];
        if (deptOptions.length > 0 && !v.department?.trim()) {
          newErrors.department = "Department is required";
        }
      }
    }
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate(formData);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSave(formData);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isNewUser ? 'bg-blue-100' : 'bg-purple-100'}`}>
              {isNewUser ? (
                <UserPlus size={24} className="text-blue-600" />
              ) : (
                <UserCog size={24} className="text-purple-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {isNewUser ? "Register New User" : "Edit User Details"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isNewUser ? "Fill in the user information below" : "Update user information"}
              </p>
            </div>
          </div>
          {!isNewUser && (
            <button 
              onClick={onCancel} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              User Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const event = { target: { name: 'userType', value: 'student' } } as React.ChangeEvent<HTMLSelectElement>;
                  handleChange(event);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.userType === 'student'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap size={24} className={formData.userType === 'student' ? 'text-blue-600' : 'text-slate-400'} />
                  <div className="text-left">
                    <div className={`font-semibold ${formData.userType === 'student' ? 'text-blue-900' : 'text-slate-700'}`}>
                      Student
                    </div>
                    <div className={`text-xs ${formData.userType === 'student' ? 'text-blue-600' : 'text-slate-500'}`}>
                      Enrolled student
                    </div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const event = { target: { name: 'userType', value: 'faculty' } } as React.ChangeEvent<HTMLSelectElement>;
                  handleChange(event);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.userType === 'faculty'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase size={24} className={formData.userType === 'faculty' ? 'text-blue-600' : 'text-slate-400'} />
                  <div className="text-left">
                    <div className={`font-semibold ${formData.userType === 'faculty' ? 'text-blue-900' : 'text-slate-700'}`}>
                      Faculty
                    </div>
                    <div className={`text-xs ${formData.userType === 'faculty' ? 'text-blue-600' : 'text-slate-500'}`}>
                      Staff member
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserCog size={18} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleChange} 
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.firstName 
                      ? 'border-red-400 bg-red-50 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`} 
                  placeholder="John"
                />
                {errors.firstName && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.firstName}</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleChange} 
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.lastName 
                      ? 'border-red-400 bg-red-50 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`} 
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Hash size={16} className="text-slate-400" />
                {formData.userType === 'faculty' ? "Faculty ID" : "ID Number"} <span className="text-red-500">*</span>
              </label>
              <input 
                name="idNumber" 
                value={formData.idNumber} 
                onChange={handleChange} 
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  errors.idNumber 
                    ? 'border-red-400 bg-red-50 focus:ring-red-500' 
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } outline-none bg-slate-50/50 hover:bg-white focus:bg-white font-mono`} 
                placeholder={formData.userType === 'faculty' ? "FAC-12345" : "2024-12345"}
              />
              {errors.idNumber && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                  <AlertCircle size={14} />
                  <span>{errors.idNumber}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                  errors.email 
                    ? 'border-red-400 bg-red-50 focus:ring-red-500' 
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`} 
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Information Section */}
          {formData.userType === 'student' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <GraduationCap size={18} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Academic Information</h3>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Year Level <span className="text-red-500">*</span>
                </label>
                <input 
                  name="yearLevel" 
                  value={formData.yearLevel} 
                  onChange={handleChange} 
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.yearLevel 
                      ? 'border-red-400 bg-red-50 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`} 
                  placeholder="e.g. 1, 2, 3, 4" 
                />
                {errors.yearLevel && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.yearLevel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* College & Department Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 size={18} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                {formData.userType === 'student' ? 'College & Department' : 'Affiliation'}
              </h3>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border-2 border-slate-100 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  College {formData.userType === 'student' && <span className="text-red-500">*</span>}
                </label>
                <select 
                  name="college" 
                  value={formData.college} 
                  onChange={handleChange} 
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all bg-white ${
                    errors.college 
                      ? 'border-red-400 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none cursor-pointer`}
                >
                  <option value="">Select College</option>
                  {colleges.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.college && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.college}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Department {formData.userType === 'student' && availableDepartments.length > 0 && <span className="text-red-500">*</span>}
                </label>
                <select 
                  name="department" 
                  value={formData.department} 
                  onChange={handleChange} 
                  disabled={!formData.college || availableDepartments.length === 0}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all bg-white ${
                    errors.department 
                      ? 'border-red-400 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {!formData.college 
                      ? "Select a college first" 
                      : availableDepartments.length === 0 
                        ? "No departments available" 
                        : "Select Department"}
                  </option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.department}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card UID Display */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-sm">
              <div className="px-2 py-1 bg-slate-200 rounded text-slate-600 font-mono text-xs">
                RFID UID
              </div>
              <span className="font-mono text-slate-700">{uid}</span>
            </div>
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save size={20} />
            {isNewUser ? "Register User" : "Save Changes"}
          </button>
          
          {!isNewUser && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3.5 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-white hover:border-slate-400 font-semibold transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
