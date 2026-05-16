import { useState, useMemo } from "react";
import {
  Save,
  X,
  UserPlus,
  UserCog,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Mail,
  Hash,
  Building2,
  PiggyBank,
  Tag,
  Heart,
  Weight,
  Calendar,
  Users,
  Activity,
} from "lucide-react";
import { colleges, departmentsByCollege } from "../data/colleges";

interface UserFormData {
  firstName: string;
  lastName: string;
  idNumber: string;
  email: string;
  userType: "student" | "faculty";
  college: string;
  department: string;
  yearLevel: string;
  status: "active" | "inactive";
}

interface UserInitialData {
  first_name?: string;
  last_name?: string;
  id_number?: string;
  email?: string;
  user_type?: "student" | "faculty";
  college?: string;
  department?: string;
  year_level?: string;
  status?: "active" | "inactive";
}

interface PigFormData {
  pigNumber: string;
  pigType: "piglet" | "sow" | "boar" | "gilt";
  sire: string;
  dam: string;
  pen: string;
  healthStatus: "healthy" | "at-risk" | "sick";
  weight: string;
  dateOfBirth: string;
  notes: string;
}

interface PigInitialData {
  pig_number?: string;
  pig_type?: "piglet" | "sow" | "boar" | "gilt";
  sire?: string;
  dam?: string;
  pen?: string;
  health_status?: "healthy" | "at-risk" | "sick";
  weight?: number;
  date_of_birth?: string;
  notes?: string;
}

interface UserFormProps {
  uid: string;
  initialData?: UserInitialData | PigInitialData;
  isNewUser: boolean;
  onSave: (data: UserFormData | PigFormData) => void;
  onCancel: () => void;
}

export function UserForm({
  uid,
  initialData,
  isNewUser,
  onSave,
  onCancel,
}: UserFormProps) {
  // In SwineSense, all new unknown RFIDs belong to pigs by default.
  const isPigData =
    !initialData || "pig_number" in initialData || "pig_type" in initialData;

  const [userFormData, setUserFormData] = useState({
    firstName: (initialData as UserInitialData)?.first_name || "",
    lastName: (initialData as UserInitialData)?.last_name || "",
    idNumber: (initialData as UserInitialData)?.id_number || "",
    email: (initialData as UserInitialData)?.email || "",
    userType: (initialData as UserInitialData)?.user_type || "student",
    college: (initialData as UserInitialData)?.college || "",
    department: (initialData as UserInitialData)?.department || "",
    yearLevel: (initialData as UserInitialData)?.year_level || "",
    status: (initialData as UserInitialData)?.status || "active",
  });

  const [pigFormData, setPigFormData] = useState({
    pigNumber: (initialData as PigInitialData)?.pig_number || "",
    pigType: (initialData as PigInitialData)?.pig_type || "piglet",
    sire: (initialData as PigInitialData)?.sire || "",
    dam: (initialData as PigInitialData)?.dam || "",
    pen: (initialData as PigInitialData)?.pen || "",
    healthStatus: (initialData as PigInitialData)?.health_status || "healthy",
    weight: (initialData as PigInitialData)?.weight?.toString() || "",
    dateOfBirth: (initialData as PigInitialData)?.date_of_birth || "",
    notes: (initialData as PigInitialData)?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handlePigChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setPigFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const collegesWithoutDepartment = new Set([
    "College of Medicine",
    "Senior High School",
  ]);

  // Derived available departments based on selected college
  const availableDepartments = useMemo(() => {
    if (!userFormData.college) return [];
    if (collegesWithoutDepartment.has(userFormData.college)) return [];

    return departmentsByCollege[userFormData.college] || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFormData.college]);

  const validateUser = (data: typeof userFormData) => {
    const newErrors: Record<string, string | undefined> = {};
    const idLabel = data.userType === "faculty" ? "Faculty ID" : "ID Number";

    if (!data.idNumber?.trim()) newErrors.idNumber = `${idLabel} is required`;
    if (!data.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!data.lastName?.trim()) newErrors.lastName = "Last name is required";

    if (data.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        newErrors.email = "Invalid email format";
      }
    }

    if (data.userType === "student") {
      if (!data.college?.trim()) newErrors.college = "College is required";
      if (!data.yearLevel?.trim())
        newErrors.yearLevel = "Year level is required";

      if (data.college && !collegesWithoutDepartment.has(data.college)) {
        const deptOptions = departmentsByCollege[data.college] ?? [];
        if (deptOptions.length > 0 && !data.department?.trim()) {
          newErrors.department = "Department is required";
        }
      }
    }
    return newErrors;
  };

  const validatePig = (data: typeof pigFormData) => {
    const newErrors: Record<string, string | undefined> = {};
    if (!data.pigNumber?.trim()) newErrors.pigNumber = "Pig number is required";
    if (!data.pigType) newErrors.pigType = "Pig type is required";
    if (!data.pen?.trim()) newErrors.pen = "Pen location is required";
    if (!data.dateOfBirth?.trim())
      newErrors.dateOfBirth = "Date of birth is required";
    if (data.weight && isNaN(Number(data.weight)))
      newErrors.weight = "Weight must be a valid number";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let newErrors: Record<string, string | undefined> = {};

    if (isPigData) {
      newErrors = validatePig(pigFormData);
      if (Object.keys(newErrors).length === 0) {
        onSave(pigFormData);
      }
    } else {
      newErrors = validateUser(userFormData);
      if (Object.keys(newErrors).length === 0) {
        onSave(userFormData);
      }
    }

    setErrors(newErrors);
  };

  // Render user form
  if (!isPigData) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-linear-to-r from-slate-50 to-blue-50/30">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${isNewUser ? "bg-blue-100" : "bg-purple-100"}`}
              >
                <UserPlus size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {isNewUser ? "Register New User" : "Edit User Details"}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {isNewUser
                    ? "Fill in the user information below"
                    : "Update user information"}
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
                  onClick={() =>
                    handleUserChange({
                      target: { name: "userType", value: "student" },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userFormData.userType === "student"
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap
                      size={24}
                      className={
                        userFormData.userType === "student"
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    />
                    <div className="text-left">
                      <div
                        className={`font-semibold ${userFormData.userType === "student" ? "text-blue-900" : "text-slate-700"}`}
                      >
                        Student
                      </div>
                      <div
                        className={`text-xs ${userFormData.userType === "student" ? "text-blue-600" : "text-slate-500"}`}
                      >
                        Enrolled student
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUserChange({
                      target: { name: "userType", value: "faculty" },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userFormData.userType === "faculty"
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase
                      size={24}
                      className={
                        userFormData.userType === "faculty"
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    />
                    <div className="text-left">
                      <div
                        className={`font-semibold ${userFormData.userType === "faculty" ? "text-blue-900" : "text-slate-700"}`}
                      >
                        Faculty
                      </div>
                      <div
                        className={`text-xs ${userFormData.userType === "faculty" ? "text-blue-600" : "text-slate-500"}`}
                      >
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
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="firstName"
                    value={userFormData.firstName}
                    onChange={handleUserChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                      errors.firstName
                        ? "border-red-400 bg-red-50 focus:ring-red-500"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                    value={userFormData.lastName}
                    onChange={handleUserChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                      errors.lastName
                        ? "border-red-400 bg-red-50 focus:ring-red-500"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Hash size={16} className="text-slate-400" />
                  {userFormData.userType === "faculty"
                    ? "Faculty ID"
                    : "ID Number"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  name="idNumber"
                  value={userFormData.idNumber}
                  onChange={handleUserChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.idNumber
                      ? "border-red-400 bg-red-50 focus:ring-red-500"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white font-mono`}
                  placeholder={
                    userFormData.userType === "faculty"
                      ? "FAC-12345"
                      : "2024-12345"
                  }
                />
                {errors.idNumber && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.idNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={userFormData.email}
                  onChange={handleUserChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.email
                      ? "border-red-400 bg-red-50 focus:ring-red-500"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
            {userFormData.userType === "student" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <GraduationCap size={18} className="text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    Academic Information
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Year Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="yearLevel"
                    value={userFormData.yearLevel}
                    onChange={handleUserChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                      errors.yearLevel
                        ? "border-red-400 bg-red-50 focus:ring-red-500"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                  {userFormData.userType === "student"
                    ? "College & Department"
                    : "Affiliation"}
                </h3>
              </div>

              <div className="p-5 bg-linear-to-br from-slate-50 to-blue-50/30 rounded-xl border-2 border-slate-100 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    College{" "}
                    {userFormData.userType === "student" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <select
                    name="college"
                    value={userFormData.college}
                    onChange={handleUserChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all bg-white ${
                      errors.college
                        ? "border-red-400 focus:ring-red-500"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    } outline-none cursor-pointer`}
                  >
                    <option value="">Select College</option>
                    {colleges.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
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
                    Department{" "}
                    {userFormData.userType === "student" &&
                      availableDepartments.length > 0 && (
                        <span className="text-red-500">*</span>
                      )}
                  </label>
                  <select
                    name="department"
                    value={userFormData.department}
                    onChange={handleUserChange}
                    disabled={
                      !userFormData.college || availableDepartments.length === 0
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all bg-white ${
                      errors.department
                        ? "border-red-400 focus:ring-red-500"
                        : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    } outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                  >
                    <option value="">
                      {!userFormData.college
                        ? "Select a college first"
                        : availableDepartments.length === 0
                          ? "No departments available"
                          : "Select Department"}
                    </option>
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
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
              className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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

  // Render pig form
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-linear-to-r from-green-50 to-blue-50/30">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100">
              <PiggyBank size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {isNewUser ? "Register New Pig" : "Edit Pig Details"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isNewUser
                  ? "Enter pig information below"
                  : "Update pig information"}
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Tag size={18} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Basic Information
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Pig Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="pigNumber"
                  value={pigFormData.pigNumber}
                  onChange={handlePigChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.pigNumber
                      ? "border-red-400 bg-red-50 focus:ring-red-500"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white font-mono`}
                  placeholder="e.g. PIG-001"
                />
                {errors.pigNumber && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.pigNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Pig Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="pigType"
                  value={pigFormData.pigType}
                  onChange={handlePigChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all bg-white ${
                    errors.pigType
                      ? "border-red-400 focus:ring-red-500"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-none cursor-pointer`}
                >
                  <option value="">Select Pig Type</option>
                  <option value="piglet">Piglet</option>
                  <option value="gilt">Gilt</option>
                  <option value="sow">Sow</option>
                  <option value="boar">Boar</option>
                </select>
                {errors.pigType && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.pigType}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={pigFormData.dateOfBirth}
                  onChange={handlePigChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.dateOfBirth
                      ? "border-red-400 bg-red-50 focus:ring-red-500"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`}
                />
                {errors.dateOfBirth && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.dateOfBirth}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Health & Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Heart size={18} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Health & Location
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Pen Location <span className="text-red-500">*</span>
                </label>
                <input
                  name="pen"
                  value={pigFormData.pen}
                  onChange={handlePigChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.pen
                      ? "border-red-400 bg-red-50 focus:ring-red-500"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`}
                  placeholder="e.g. Pen A-1"
                />
                {errors.pen && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.pen}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Health Status
                </label>
                <select
                  name="healthStatus"
                  value={pigFormData.healthStatus}
                  onChange={handlePigChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                >
                  <option value="healthy">Healthy</option>
                  <option value="at-risk">At Risk</option>
                  <option value="sick">Sick</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Weight size={16} className="text-slate-400" />
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={pigFormData.weight}
                  onChange={handlePigChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.weight
                      ? "border-red-400 bg-red-50 focus:ring-red-500"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`}
                  placeholder="0.0"
                />
                {errors.weight && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.weight}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lineage Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Users size={18} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Lineage Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Sire (Father)
                </label>
                <input
                  name="sire"
                  value={pigFormData.sire}
                  onChange={handlePigChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white"
                  placeholder="Sire pig number"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Dam (Mother)
                </label>
                <input
                  name="dam"
                  value={pigFormData.dam}
                  onChange={handlePigChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white"
                  placeholder="Dam pig number"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Activity size={18} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Additional Notes
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                Notes
              </label>
              <textarea
                name="notes"
                value={pigFormData.notes}
                onChange={handlePigChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white resize-none"
                placeholder="Any additional notes about this pig..."
              />
            </div>
          </div>

          {/* RFID Tag Display */}
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
            className="flex-1 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save size={20} />
            {isNewUser ? "Register Pig" : "Save Changes"}
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
