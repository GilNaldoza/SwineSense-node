import { useState } from "react";
import {
  Pig,
  Thermometer,
  Droplets,
  TrendingUp,
  Activity,
  Save,
  AlertCircle,
  Beef,
  Scale,
  Calendar,
  MapPin,
  Users,
  BarChart3
} from "lucide-react";

interface SwineSenseData {
  farmName: string;
  location: string;
  totalPigs: string;
  activePigs: string;
  temperature: string;
  humidity: string;
  feedStock: string;
  waterQuality: string;
  healthAlerts: string;
  dailyWeight: string;
  breed: string;
  age: string;
}

interface SwineSenseDashboardProps {
  onSave: (data: SwineSenseData) => void;
  onCancel: () => void;
}

export function UserForm({ onSave, onCancel }: SwineSenseDashboardProps) {
  const [formData, setFormData] = useState<SwineSenseData>({
    farmName: "",
    location: "",
    totalPigs: "",
    activePigs: "",
    temperature: "",
    humidity: "",
    feedStock: "",
    waterQuality: "",
    healthAlerts: "",
    dailyWeight: "",
    breed: "",
    age: ""
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = (data: SwineSenseData) => {
    const newErrors: Record<string, string | undefined> = {};
    if (!data.farmName?.trim()) newErrors.farmName = "Farm name is required";
    if (!data.location?.trim()) newErrors.location = "Location is required";
    if (!data.totalPigs?.trim()) newErrors.totalPigs = "Total pigs count is required";
    if (!data.temperature?.trim()) newErrors.temperature = "Temperature is required";
    if (!data.humidity?.trim()) newErrors.humidity = "Humidity is required";
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
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-green-50 to-blue-50/30">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100">
              <Pig size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                SwineSense Dashboard
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Monitor and manage your swine farm data
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
          >
            ×
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Farm Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <MapPin size={18} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Farm Information</h3>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Farm Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.farmName
                      ? 'border-red-400 bg-red-50 focus:ring-red-500'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`}
                  placeholder="Enter farm name"
                />
                {errors.farmName && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.farmName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.location
                      ? 'border-red-400 bg-red-50 focus:ring-red-500'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`}
                  placeholder="Farm location"
                />
                {errors.location && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pig Statistics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Users size={18} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Pig Statistics</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Total Pigs <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="totalPigs"
                    value={formData.totalPigs}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                      errors.totalPigs
                        ? 'border-red-400 bg-red-50 focus:ring-red-500'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`}
                    placeholder="0"
                  />
                  {errors.totalPigs && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                      <AlertCircle size={14} />
                      <span>{errors.totalPigs}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Active Pigs
                  </label>
                  <input
                    type="number"
                    name="activePigs"
                    value={formData.activePigs}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Thermometer size={18} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Environmental Data</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Temperature (°C) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.temperature
                      ? 'border-red-400 bg-red-50 focus:ring-red-500'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`}
                  placeholder="25.5"
                />
                {errors.temperature && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.temperature}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Humidity (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="humidity"
                  value={formData.humidity}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                    errors.humidity
                      ? 'border-red-400 bg-red-50 focus:ring-red-500'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } outline-none bg-slate-50/50 hover:bg-white focus:bg-white`}
                  placeholder="65.0"
                />
                {errors.humidity && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle size={14} />
                    <span>{errors.humidity}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resource Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <BarChart3 size={18} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Resource Management</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Feed Stock (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="feedStock"
                  value={formData.feedStock}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white"
                  placeholder="500.0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Water Quality (pH)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="waterQuality"
                  value={formData.waterQuality}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white"
                  placeholder="7.0"
                />
              </div>
            </div>
          </div>

          {/* Health & Monitoring */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Activity size={18} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Health & Monitoring</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Health Alerts
                </label>
                <textarea
                  name="healthAlerts"
                  value={formData.healthAlerts}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white resize-none"
                  placeholder="Any health issues or alerts..."
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Average Daily Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="dailyWeight"
                    value={formData.dailyWeight}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white"
                    placeholder="85.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Primary Breed
                    </label>
                    <input
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white"
                      placeholder="Yorkshire"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Average Age (months)
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50/50 hover:bg-white focus:bg-white"
                      placeholder="6"
                    />
                  </div>
                </div>
              </div>
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
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save size={20} />
            Save Dashboard Data
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-white hover:border-slate-400 font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}