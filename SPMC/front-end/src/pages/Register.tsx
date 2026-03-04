import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { authAPI } from "@/lib/api";
import { AboutUsDialog } from "@/components/ui/AboutUsDialog";
import { Eye, EyeOff, Building2, ArrowLeft, Phone, MapPin } from "lucide-react";
import { 
  fetchRegions, 
  fetchProvinces, 
  fetchCitiesMunicipalities, 
  fetchBarangays,
  type Region,
  type Province,
  type CityMunicipality,
  type Barangay
} from "@/services/psaApi";

const Register = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<CityMunicipality[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingBarangays, setLoadingBarangays] = useState(false);
  
  const [formData, setFormData] = useState({
    // Account Credentials
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    
    // Hospital Information
    hospitalName: "",
    hospitalDohLevel: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    completeAddress: "",
    isInsideDavaoCity: true,
    contactNumbers: [] as string[],
    
    // Agreement
    agreeToPrivacy: false,
  });
  
  const [currentContactNumber, setCurrentContactNumber] = useState("");
  
  const [files, setFiles] = useState<FileList | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load regions on component mount
  useEffect(() => {
    const loadRegions = async () => {
      setLoadingRegions(true);
      const data = await fetchRegions();
      setRegions(data);
      setLoadingRegions(false);
    };
    loadRegions();
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    const loadProvinces = async () => {
      if(formData.region) {
        const data = await fetchProvinces(formData.region);
        setProvinces(data);
        setCities([]);
        setBarangays([]);
        // Reset dependent fields
        setFormData(prev => ({ ...prev, province: '', city: '', barangay: '' }));
      } else {
        setProvinces([]);
        setCities([]);
        setBarangays([]);
      }
    };
    loadProvinces();
  }, [formData.region]);

  // Load cities when province changes
  useEffect(() => {
    const loadCities = async () => {
      if(formData.province) {
        const data = await fetchCitiesMunicipalities(formData.province);
        setCities(data);
        setBarangays([]);
        // Reset dependent fields
        setFormData(prev => ({ ...prev, city: '', barangay: '' }));
      } else {
        setCities([]);
        setBarangays([]);
      }
    };
    loadCities();
  }, [formData.province]);

  // Load barangays when city changes
  useEffect(() => {
    const loadBarangays = async () => {
      if(formData.city) {
        setLoadingBarangays(true);
        const data = await fetchBarangays(formData.city);
        setBarangays(data);
        setLoadingBarangays(false);
        // Reset barangay field
        setFormData(prev => ({ ...prev, barangay: '' }));
      } else {
        setBarangays([]);
        setLoadingBarangays(false);
      }
    };
    loadBarangays();
  }, [formData.city]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Privacy agreement validation
    if (!formData.agreeToPrivacy) {
      toast({
        variant: "destructive",
        title: "Privacy Agreement Required",
        description: "You must agree to the Data Privacy Act to proceed.",
      });
      return;
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Passwords do not match. Please check and try again.",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    // Contact numbers validation
    if (formData.contactNumbers.length === 0) {
      toast({
        variant: "destructive",
        title: "Contact Number Required",
        description: "Please add at least one hospital contact number.",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get the actual names from the selected codes
      const selectedRegion = regions.find(r => r.code === formData.region);
      const selectedProvince = provinces.find(p => p.code === formData.province);
      const selectedCity = cities.find(c => c.code === formData.city);
      const selectedBarangay = barangays.find(b => b.code === formData.barangay);

      // Debug: Log what we found
      console.log('Selected Region:', selectedRegion);
      console.log('Selected Province:', selectedProvince);
      console.log('Selected City:', selectedCity);
      console.log('Selected Barangay:', selectedBarangay);

      // Prepare hospital registration data
      const fd = new FormData();
      
      // Account credentials
      fd.append('username', formData.username);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      
      // For hospital accounts, use hospital name as first/last name
      // This is required by comprehensive_register_view
      fd.append('first_name', formData.hospitalName.split(' ')[0] || 'Hospital');
      fd.append('last_name', formData.hospitalName.split(' ').slice(1).join(' ') || 'Account');
      fd.append('referrer_type', 'hospital_account');
      
      // Hospital information
      fd.append('hospital_name', formData.hospitalName);
      fd.append('hospital_doh_level', formData.hospitalDohLevel);
      fd.append('is_inside_davao_city', String(formData.isInsideDavaoCity));
      
      // Address fields - send the NAMES, not the codes
      // Make sure we have the names, otherwise use empty string
      fd.append('region', selectedRegion?.name || '');
      fd.append('province', selectedProvince?.name || '');
      fd.append('city', selectedCity?.name || '');
      // Handle barangay: if selectedBarangay exists (from dropdown), use its name; otherwise use the text value directly
      // This handles both cases: when barangays load (dropdown with codes) and when they fail (text input with names)
      fd.append('barangay', selectedBarangay?.name || formData.barangay || '');
      fd.append('complete_address', formData.completeAddress);
      fd.append('address', formData.completeAddress); // Also send as 'address' for hospital_location
      
      // Contact numbers (as JSON array)
      fd.append('contact_numbers', JSON.stringify(formData.contactNumbers));
      
      // Files
      if (files) {
        Array.from(files).forEach(f => fd.append('documents', f));
      }

      // Debug: Log what we're sending
      console.log('Sending registration data:');
      for (let [key, value] of fd.entries()) {
        console.log(`${key}:`, value);
      }

      // Use comprehensive registration endpoint
      await authAPI.registerComprehensive(fd);
      
      toast({
        title: "Hospital Registration Submitted! 🎉",
        description: "Your hospital account is pending approval. An administrator will review your registration. You will be able to login once approved.",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to create hospital account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Login</span>
        </Link>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <AboutUsDialog isDarkMode={false} />
      </div>

      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hospital Registration</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Register your hospital to submit patient referrals to SPMC. Individual staff members will enter their information when submitting referrals.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Account Credentials
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username for hospital account"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Hospital email address"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Hospital Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleInputChange}
                  placeholder="Complete hospital name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DOH Level *
                </label>
                <select
                  name="hospitalDohLevel"
                  value={formData.hospitalDohLevel}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select DOH Level</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </div>

            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                <MapPin className="w-5 h-5 inline mr-2" />
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region *
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    required
                    disabled={loadingRegions}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">{loadingRegions ? 'Loading regions...' : 'Select Region'}</option>
                    {regions.map((r) => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Province *
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.region || provinces.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">{!formData.region ? 'Select region first' : provinces.length === 0 ? 'Loading provinces...' : 'Select Province'}</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City / Municipality *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.province || cities.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">
                      {!formData.province 
                        ? 'Select province first' 
                        : cities.length === 0 
                        ? 'Loading cities...' 
                        : 'Select City / Municipality'}
                    </option>
                    {cities.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Barangay (Optional)
                  </label>
                  {!loadingBarangays && formData.city && barangays.length === 0 ? (
                    // Show text input if barangays failed to load
                    <input
                      type="text"
                      name="barangay"
                      value={formData.barangay}
                      onChange={handleInputChange}
                      placeholder="Enter barangay name (optional)"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    // Show dropdown if barangays loaded successfully
                    <>
                      <select
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleInputChange}
                        disabled={!formData.city || loadingBarangays}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      >
                        <option value="">
                          {!formData.city 
                            ? 'Select city first' 
                            : loadingBarangays 
                            ? 'Loading barangays...' 
                            : 'Select Barangay (Optional)'}
                        </option>
                        {barangays.map((b) => (
                          <option key={b.code} value={b.code}>{b.name}</option>
                        ))}
                      </select>
                      {loadingBarangays && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Loading barangays... This may take a moment.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Complete Hospital Address (Street, Building, District) *
                </label>
                <textarea
                  name="completeAddress"
                  value={formData.completeAddress}
                  onChange={handleInputChange}
                  placeholder="Include street name, building number, district, and any landmarks"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                <Phone className="w-5 h-5 inline mr-2" />
                Contact Numbers
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Hospital Contact Numbers *
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={currentContactNumber}
                    onChange={(e) => setCurrentContactNumber(e.target.value)}
                    placeholder="e.g., 082-123-4567 or 0917-123-4567"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (currentContactNumber.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          contactNumbers: [...prev.contactNumbers, currentContactNumber.trim()]
                        }));
                        setCurrentContactNumber("");
                      }
                    }}
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Add at least one contact number. You can add multiple numbers.
                </p>
              </div>

              {formData.contactNumbers.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Numbers ({formData.contactNumbers.length}):
                  </p>
                  <div className="space-y-2">
                    {formData.contactNumbers.map((number, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          <Phone className="w-4 h-4 inline mr-2" />
                          {number}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              contactNumbers: prev.contactNumbers.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Legal Documents
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Hospital Legal Documents *
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFiles}
                  required
                  className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Upload hospital registration documents, business permits, or other legal documents for verification.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToPrivacy"
                  checked={formData.agreeToPrivacy}
                  onChange={handleInputChange}
                  required
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:focus:ring-blue-400"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  <strong>Data Privacy Acknowledgment *</strong><br />
                  I acknowledge that all data obtained during the verification process are protected under Republic Act No. 10173, also known as the Data Privacy Act of 2012. I understand that such data shall be handled with utmost confidentiality and shall be collected, processed, stored, and used strictly in accordance with the provisions of the Act and its implementing rules and regulations.
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
            >
              {loading ? "Submitting Registration..." : "Register Hospital"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
