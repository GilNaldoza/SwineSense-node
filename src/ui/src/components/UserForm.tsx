import { useState, useMemo } from "react";
import { Save, X } from "lucide-react";
import { colleges, departmentsByCollege } from "../data/colleges";

interface UserFormProps {
  uid: string;
  initialData?: any;
  isNewUser: boolean;
  onSave: (data: any) => void;
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">
          {isNewUser ? "Register New User" : "Edit User Details"}
        </h2>
        {!isNewUser && (
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Type */}
        <div>
           <label className="block text-sm font-medium text-slate-700 mb-1">User Type</label>
           <select name="userType" value={formData.userType} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md bg-white">
               <option value="student">Student</option>
               <option value="faculty">Faculty</option>
           </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                className={`w-full p-2 border rounded-md ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
              />
              {errors.firstName && <span className="text-xs text-red-500 mt-1">{errors.firstName}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                className={`w-full p-2 border rounded-md ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
              />
              {errors.lastName && <span className="text-xs text-red-500 mt-1">{errors.lastName}</span>}
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {formData.userType === 'faculty' ? "Faculty ID" : "ID Number"}
          </label>
          <input 
            name="idNumber" 
            value={formData.idNumber} 
            onChange={handleChange} 
            className={`w-full p-2 border rounded-md ${errors.idNumber ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
          />
          {errors.idNumber && <span className="text-xs text-red-500 mt-1">{errors.idNumber}</span>}
        </div>

        {/* Year Level - Hidden for Faculty */}
        {formData.userType === 'student' && (
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year Level</label>
              <input 
                name="yearLevel" 
                value={formData.yearLevel} 
                onChange={handleChange} 
                className={`w-full p-2 border rounded-md ${errors.yearLevel ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
                placeholder="e.g. 1, 2, 4" 
              />
              {errors.yearLevel && <span className="text-xs text-red-500 mt-1">{errors.yearLevel}</span>}
          </div>
        )}

        {/* College & Dept - Hidden for Faculty? Reference form implies validation is skipped, let's keep them visible but optional for faculty if they want to fill it, or hide? 
            The reference form keeps them visible but doesn't validate. I'll act on 'null' request by making them optional. 
        */}
        
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    College {formData.userType === 'student' && <span className="text-red-500">*</span>}
                </label>
                <select 
                    name="college" 
                    value={formData.college} 
                    onChange={handleChange} 
                    className={`w-full p-2 border rounded-md bg-white ${errors.college ? 'border-red-500' : 'border-slate-300'}`}
                >
                    <option value="">Select College</option>
                    {colleges.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                {errors.college && <span className="text-xs text-red-500 mt-1">{errors.college}</span>}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department {formData.userType === 'student' && availableDepartments.length > 0 && <span className="text-red-500">*</span>}
                </label>
                <select 
                    name="department" 
                    value={formData.department} 
                    onChange={handleChange} 
                    disabled={!formData.college || availableDepartments.length === 0}
                    className={`w-full p-2 border rounded-md bg-white disabled:bg-slate-100 disabled:text-slate-400 ${errors.department ? 'border-red-500' : 'border-slate-300'}`}
                >
                    <option value="">Select Department</option>
                    {availableDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
                {errors.department && <span className="text-xs text-red-500 mt-1">{errors.department}</span>}
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
          />
          {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Save size={18} />
            Save User
          </button>
          
          {!isNewUser && (
             <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
