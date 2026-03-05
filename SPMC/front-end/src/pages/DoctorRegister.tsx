import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { authAPI } from "@/lib/api";
import { Eye, EyeOff, ArrowLeft, Stethoscope } from "lucide-react";

const DoctorRegister = () => {
  const [fieldErrors, setFieldErrors] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    // Account Credentials
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    
    // Professional Information
    specialties: [] as string[],
    department: "",
    spmcId: "",
    
    // Agreement
    agreeToPrivacy: false,
  });
  
  const [spmcIdFile, setSpmcIdFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Available specialties (you can fetch from API)
  const availableSpecialties = [
    "Internal Medicine",
    "Surgery",
    "Pediatrics",
    "Obstetrics and Gynecology",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Anesthesiology",
    "Radiology",
    "Pathology",
    "Emergency Medicine",
    "Family Medicine",
  ];

  // Available departments
  const departments = [
    { value: "emergency", label: "Emergency Department" },
    { value: "internal_medicine", label: "Internal Medicine" },
    { value: "surgery", label: "Surgery Department" },
    { value: "obstetrics_gynecology", label: "Obstetrics and Gynecology" },
    { value: "pediatrics", label: "Pediatrics" },
    { value: "orthopedics", label: "Orthopedics" },
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "anesthesiology", label: "Anesthesiology" },
    { value: "radiology", label: "Radiology" },
    { value: "pathology", label: "Pathology" },
    { value: "other", label: "Other Department" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      
      // Clear error for checkbox
      if (checked && fieldErrors.has(name)) {
        setFieldErrors(prev => {
          const newErrors = new Set(prev);
          newErrors.delete(name);
          return newErrors;
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error when field has value
      if (fieldErrors.has(name) && value.trim() !== '') {
        setFieldErrors(prev => {
          const newErrors = new Set(prev);
          newErrors.delete(name);
          return newErrors;
        });
      }
    }
  };

  const getFieldErrorClass = (fieldName: string) => {
    return fieldErrors.has(fieldName) ? 'border-red-500 border-2' : '';
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
    
    // Clear error when at least one specialty is selected
    const newSpecialties = formData.specialties.includes(specialty)
      ? formData.specialties.filter(s => s !== specialty)
      : [...formData.specialties, specialty];
    
    if (newSpecialties.length > 0 && fieldErrors.has('specialties')) {
      setFieldErrors(prev => {
        const newErrors = new Set(prev);
        newErrors.delete('specialties');
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSpmcIdFile(e.target.files[0]);
      
      // Clear error when file is selected
      if (fieldErrors.has('spmcIdFile')) {
        setFieldErrors(prev => {
          const newErrors = new Set(prev);
          newErrors.delete('spmcIdFile');
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent default form validation
    
    // Validate all required fields
    const errors = new Set<string>();
    
    // Account Credentials
    if (!formData.username.trim()) errors.add('username');
    if (!formData.email.trim()) errors.add('email');
    if (!formData.password.trim()) errors.add('password');
    if (!formData.confirmPassword.trim()) errors.add('confirmPassword');
    
    // Personal Information
    if (!formData.firstName.trim()) errors.add('firstName');
    if (!formData.lastName.trim()) errors.add('lastName');
    
    // Professional Information
    if (formData.specialties.length === 0) errors.add('specialties');
    if (!formData.department) errors.add('department');
    if (!formData.spmcId.trim()) errors.add('spmcId');
    if (!spmcIdFile) errors.add('spmcIdFile');
    
    // Privacy Agreement
    if (!formData.agreeToPrivacy) errors.add('agreeToPrivacy');
    
    setFieldErrors(errors);
    
    if (errors.size > 0) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields marked in red.",
        variant: "destructive",
      });
      return;
    }
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (formData.specialties.length === 0) {
      toast({
        variant: "destructive",
        title: "Specialty Required",
        description: "Please select at least one specialty.",
      });
      return;
    }

    if (!spmcIdFile) {
      toast({
        variant: "destructive",
        title: "SPMC ID Required",
        description: "Please upload your valid SPMC ID.",
      });
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      
      // Account credentials
      fd.append('username', formData.username);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      
      // Personal information
      fd.append('first_name', formData.firstName);
      fd.append('middle_name', formData.middleName);
      fd.append('last_name', formData.lastName);
      
      // Professional information
      fd.append('role', 'doctor');
      fd.append('specialties', JSON.stringify(formData.specialties));
      fd.append('department', formData.department);
      fd.append('spmc_id', formData.spmcId);
      
      // SPMC ID file
      if (spmcIdFile) {
        fd.append('spmc_id_file', spmcIdFile);
      }

      const response = await authAPI.registerDoctor(fd);
      
      toast({
        title: "Doctor Registration Submitted! 🎉",
        description: "Your account is pending approval. An administrator will review your registration. You will be able to login once approved.",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 8000, // Show for 8 seconds
      });

      setTimeout(() => navigate('/login'), 8000); // Wait 8 seconds before redirect
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to create doctor account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-10 text-white">
            <Link to="/login" className="inline-flex items-center text-white hover:text-blue-100 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Doctor Registration</h1>
                <p className="text-blue-100 mt-1">Join SPMC Medical Staff</p>
              </div>
            </div>
            <p className="text-white/90">
              Register as a doctor to access department-specific referrals and patient information.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Account Credentials */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Account Credentials
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getFieldErrorClass('username')}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@spmc.gov.ph"
                  className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getFieldErrorClass('email')}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="At least 8 characters"
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-12 ${getFieldErrorClass('password')}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter your password"
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-12 ${getFieldErrorClass('confirmPassword')}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getFieldErrorClass('firstName')}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getFieldErrorClass('lastName')}`}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Professional Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialty/ies * (Select all that apply)
                </label>
                <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${getFieldErrorClass('specialties')}`}>
                  {availableSpecialties.map((specialty) => (
                    <label key={specialty} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{specialty}</span>
                    </label>
                  ))}
                </div>
                {formData.specialties.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Selected: {formData.specialties.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department (Where you belong in SPMC) <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getFieldErrorClass('department')}`}
                >
                  <option value="">Select your department</option>
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SPMC ID Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="spmcId"
                  value={formData.spmcId}
                  onChange={handleInputChange}
                  placeholder="Enter your SPMC ID number"
                  className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getFieldErrorClass('spmcId')}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Valid SPMC ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${getFieldErrorClass('spmcIdFile')}`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Upload a clear photo or scan of your valid SPMC ID for verification.
                </p>
                {spmcIdFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✓ File selected: {spmcIdFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Privacy Agreement */}
            <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <input
                type="checkbox"
                name="agreeToPrivacy"
                checked={formData.agreeToPrivacy}
                onChange={handleInputChange}
                className={`mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 ${getFieldErrorClass('agreeToPrivacy')}`}
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the terms and conditions and privacy policy. I understand that my registration will be reviewed by an administrator before approval.
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !formData.agreeToPrivacy}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-medium"
            >
              {loading ? "Submitting Registration..." : "Register as Doctor"}
            </Button>
          </form>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-green-600 hover:text-green-700 dark:text-green-400 font-medium">
                Login here
              </Link>
            </p>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
              For hospital registration,{" "}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                click here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;
