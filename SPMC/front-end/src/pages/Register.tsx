import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { authAPI } from "@/lib/api";
import { Eye, EyeOff, User } from "lucide-react";

const Register = () => {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    referrerType: "doctor",
    specialties: [] as number[],
    affiliateHospitals: [] as number[],
    hospitalName: "",
    age: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    exactAddress: "",
    gender: "",
    position: "",
    profession: "",
    cellphone: "",
    hospitalLocation: "",
    isInsideDavao: true,
    agreeToPrivacy: false,
  });
  
  const [files, setFiles] = useState<FileList | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Hardcoded data for Region 11 and 12
  const regionsData = [
    { id: '11', code: '11', name: 'Region XI (Davao Region)' },
    { id: '12', code: '12', name: 'Region XII (SOCCSKSARGEN)' }
  ];

  const provincesData = {
    '11': [
      { id: '1123', code: '1123', name: 'Davao de Oro (Compostela Valley)' },
      { id: '1124', code: '1124', name: 'Davao del Norte' },
      { id: '1125', code: '1125', name: 'Davao del Sur' },
      { id: '1126', code: '1126', name: 'Davao Occidental' },
      { id: '1127', code: '1127', name: 'Davao Oriental' }
    ],
    '12': [
      { id: '1247', code: '1247', name: 'North Cotabato' },
      { id: '1248', code: '1248', name: 'Sarangani' },
      { id: '1249', code: '1249', name: 'South Cotabato' },
      { id: '1250', code: '1250', name: 'Sultan Kudarat' }
    ]
  };

  const citiesData = {
    // Davao de Oro (Compostela Valley)
    '1123': [
      { id: '112301', code: '112301', name: 'Pantukan' },
      { id: '112302', code: '112302', name: 'Nabunturan' },
      { id: '112303', code: '112303', name: 'Compostela' },
      { id: '112304', code: '112304', name: 'Laak' },
      { id: '112305', code: '112305', name: 'Mabini' },
      { id: '112306', code: '112306', name: 'Maco' },
      { id: '112307', code: '112307', name: 'Maragusan' },
      { id: '112308', code: '112308', name: 'Mawab' },
      { id: '112309', code: '112309', name: 'Monkayo' },
      { id: '112310', code: '112310', name: 'Montevista' },
      { id: '112311', code: '112311', name: 'New Bataan' }
    ],
    // Davao del Norte
    '1124': [
      { id: '112401', code: '112401', name: 'Tagum City' },
      { id: '112402', code: '112402', name: 'Panabo City' },
      { id: '112403', code: '112403', name: 'Samal City' },
      { id: '112404', code: '112404', name: 'Asuncion' },
      { id: '112405', code: '112405', name: 'Braulio E. Dujali' },
      { id: '112406', code: '112406', name: 'Carmen' },
      { id: '112407', code: '112407', name: 'Kapalong' },
      { id: '112408', code: '112408', name: 'New Corella' },
      { id: '112409', code: '112409', name: 'San Isidro' },
      { id: '112410', code: '112410', name: 'Santo Tomas' },
      { id: '112411', code: '112411', name: 'Talaingod' }
    ],
    // Davao del Sur
    '1125': [
      { id: '112501', code: '112501', name: 'Davao City' },
      { id: '112502', code: '112502', name: 'Digos City' },
      { id: '112503', code: '112503', name: 'Bansalan' },
      { id: '112504', code: '112504', name: 'Hagonoy' },
      { id: '112505', code: '112505', name: 'Kiblawan' },
      { id: '112506', code: '112506', name: 'Magsaysay' },
      { id: '112507', code: '112507', name: 'Malalag' },
      { id: '112508', code: '112508', name: 'Matanao' },
      { id: '112509', code: '112509', name: 'Padada' },
      { id: '112510', code: '112510', name: 'Santa Cruz' },
      { id: '112511', code: '112511', name: 'Sulop' }
    ],
    // Davao Occidental
    '1126': [
      { id: '112601', code: '112601', name: 'Malita' },
      { id: '112602', code: '112602', name: 'Don Marcelino' },
      { id: '112603', code: '112603', name: 'Jose Abad Santos' },
      { id: '112604', code: '112604', name: 'Santa Maria' }
    ],
    // Davao Oriental
    '1127': [
      { id: '112701', code: '112701', name: 'Mati City' },
      { id: '112702', code: '112702', name: 'Baganga' },
      { id: '112703', code: '112703', name: 'Banaybanay' },
      { id: '112704', code: '112704', name: 'Boston' },
      { id: '112705', code: '112705', name: 'Caraga' },
      { id: '112706', code: '112706', name: 'Cateel' },
      { id: '112707', code: '112707', name: 'Governor Generoso' },
      { id: '112708', code: '112708', name: 'Lupon' },
      { id: '112709', code: '112709', name: 'Manay' },
      { id: '112710', code: '112710', name: 'San Isidro' },
      { id: '112711', code: '112711', name: 'Tarragona' }
    ],
    // North Cotabato
    '1247': [
      { id: '124701', code: '124701', name: 'Kidapawan City' },
      { id: '124702', code: '124702', name: 'Alamada' },
      { id: '124703', code: '124703', name: 'Aleosan' },
      { id: '124704', code: '124704', name: 'Antipas' },
      { id: '124705', code: '124705', name: 'Arakan' },
      { id: '124706', code: '124706', name: 'Banisilan' },
      { id: '124707', code: '124707', name: 'Carmen' },
      { id: '124708', code: '124708', name: 'Kabacan' },
      { id: '124709', code: '124709', name: 'Libungan' },
      { id: '124710', code: '124710', name: 'Magpet' },
      { id: '124711', code: '124711', name: 'Makilala' },
      { id: '124712', code: '124712', name: 'Matalam' },
      { id: '124713', code: '124713', name: 'Midsayap' },
      { id: '124714', code: '124714', name: 'M\'lang' },
      { id: '124715', code: '124715', name: 'Pigcawayan' },
      { id: '124716', code: '124716', name: 'Pikit' },
      { id: '124717', code: '124717', name: 'President Roxas' },
      { id: '124718', code: '124718', name: 'Tulunan' }
    ],
    // Sarangani
    '1248': [
      { id: '124801', code: '124801', name: 'Alabel' },
      { id: '124802', code: '124802', name: 'Glan' },
      { id: '124803', code: '124803', name: 'Kiamba' },
      { id: '124804', code: '124804', name: 'Maasim' },
      { id: '124805', code: '124805', name: 'Maitum' },
      { id: '124806', code: '124806', name: 'Malapatan' },
      { id: '124807', code: '124807', name: 'Malungon' }
    ],
    // South Cotabato
    '1249': [
      { id: '124901', code: '124901', name: 'General Santos City' },
      { id: '124902', code: '124902', name: 'Koronadal City' },
      { id: '124903', code: '124903', name: 'Banga' },
      { id: '124904', code: '124904', name: 'Lake Sebu' },
      { id: '124905', code: '124905', name: 'Norala' },
      { id: '124906', code: '124906', name: 'Polomolok' },
      { id: '124907', code: '124907', name: 'Santo Niño' },
      { id: '124908', code: '124908', name: 'Surallah' },
      { id: '124909', code: '124909', name: 'T\'boli' },
      { id: '124910', code: '124910', name: 'Tampakan' },
      { id: '124911', code: '124911', name: 'Tantangan' },
      { id: '124912', code: '124912', name: 'Tupi' }
    ],
    // Sultan Kudarat
    '1250': [
      { id: '125001', code: '125001', name: 'Isulan' },
      { id: '125002', code: '125002', name: 'Tacurong City' },
      { id: '125003', code: '125003', name: 'Bagumbayan' },
      { id: '125004', code: '125004', name: 'Columbio' },
      { id: '125005', code: '125005', name: 'Esperanza' },
      { id: '125006', code: '125006', name: 'Kalamansig' },
      { id: '125007', code: '125007', name: 'Lebak' },
      { id: '125008', code: '125008', name: 'Lutayan' },
      { id: '125009', code: '125009', name: 'Lambayong' },
      { id: '125010', code: '125010', name: 'Palimbang' },
      { id: '125011', code: '125011', name: 'President Quirino' },
      { id: '125012', code: '125012', name: 'Senator Ninoy Aquino' }
    ]
  };

  const barangaysData = {
    // Sample barangays for Davao City (you can expand this for other cities)
    '112501': [
      { id: '11250101', code: '11250101', name: 'Agdao' },
      { id: '11250102', code: '11250102', name: 'Bago Aplaya' },
      { id: '11250103', code: '11250103', name: 'Bago Gallera' },
      { id: '11250104', code: '11250104', name: 'Baguio' },
      { id: '11250105', code: '11250105', name: 'Bangkas Heights' },
      { id: '11250106', code: '11250106', name: 'Biao Escuela' },
      { id: '11250107', code: '11250107', name: 'Biao Guianga' },
      { id: '11250108', code: '11250108', name: 'Biao Joaquin' },
      { id: '11250109', code: '11250109', name: 'Bucana' },
      { id: '11250110', code: '11250110', name: 'Buhangin' },
      { id: '11250111', code: '11250111', name: 'Bunawan' },
      { id: '11250112', code: '11250112', name: 'Calinan' },
      { id: '11250113', code: '11250113', name: 'Catalunan Grande' },
      { id: '11250114', code: '11250114', name: 'Catalunan Pequeño' },
      { id: '11250115', code: '11250115', name: 'Centro (Poblacion)' },
      { id: '11250116', code: '11250116', name: 'Daliao' },
      { id: '11250117', code: '11250117', name: 'Dumoy' },
      { id: '11250118', code: '11250118', name: 'Eden' },
      { id: '11250119', code: '11250119', name: 'Ilang' },
      { id: '11250120', code: '11250120', name: 'Inayawan' },
      { id: '11250121', code: '11250121', name: 'Lacson' },
      { id: '11250122', code: '11250122', name: 'Lamanan' },
      { id: '11250123', code: '11250123', name: 'Lampianao' },
      { id: '11250124', code: '11250124', name: 'Lanang' },
      { id: '11250125', code: '11250125', name: 'Leon Garcia' },
      { id: '11250126', code: '11250126', name: 'Libby' },
      { id: '11250127', code: '11250127', name: 'Lizada' },
      { id: '11250128', code: '11250128', name: 'Ma-a' },
      { id: '11250129', code: '11250129', name: 'Magtuod' },
      { id: '11250130', code: '11250130', name: 'Mahayag' },
      { id: '11250131', code: '11250131', name: 'Malabog' },
      { id: '11250132', code: '11250132', name: 'Malagos' },
      { id: '11250133', code: '11250133', name: 'Malamba' },
      { id: '11250134', code: '11250134', name: 'Manambulan' },
      { id: '11250135', code: '11250135', name: 'Mandug' },
      { id: '11250136', code: '11250136', name: 'Matina Aplaya' },
      { id: '11250137', code: '11250137', name: 'Matina Crossing' },
      { id: '11250138', code: '11250138', name: 'Matina Pangi' },
      { id: '11250139', code: '11250139', name: 'Mintal' },
      { id: '11250140', code: '11250140', name: 'Mudiang' },
      { id: '11250141', code: '11250141', name: 'Mulig' },
      { id: '11250142', code: '11250142', name: 'New Carmen' },
      { id: '11250143', code: '11250143', name: 'New Valencia' },
      { id: '11250144', code: '11250144', name: 'Pampanga' },
      { id: '11250145', code: '11250145', name: 'Panacan' },
      { id: '11250146', code: '11250146', name: 'Paquibato' },
      { id: '11250147', code: '11250147', name: 'Paradise Embac' },
      { id: '11250148', code: '11250148', name: 'Riverside' },
      { id: '11250149', code: '11250149', name: 'Salizon' },
      { id: '11250150', code: '11250150', name: 'Sibulan' },
      { id: '11250151', code: '11250151', name: 'Sirawan' },
      { id: '11250152', code: '11250152', name: 'Sirib' },
      { id: '11250153', code: '11250153', name: 'Tacunan' },
      { id: '11250154', code: '11250154', name: 'Tagakpan' },
      { id: '11250155', code: '11250155', name: 'Tagurano' },
      { id: '11250156', code: '11250156', name: 'Talandang' },
      { id: '11250157', code: '11250157', name: 'Talomo' },
      { id: '11250158', code: '11250158', name: 'Tamayong' },
      { id: '11250159', code: '11250159', name: 'Tamugan' },
      { id: '11250160', code: '11250160', name: 'Tapak' },
      { id: '11250161', code: '11250161', name: 'Tibuloy' },
      { id: '11250162', code: '11250162', name: 'Tibungco' },
      { id: '11250163', code: '11250163', name: 'Tigatto' },
      { id: '11250164', code: '11250164', name: 'Toril' },
      { id: '11250165', code: '11250165', name: 'Tugbok' },
      { id: '11250166', code: '11250166', name: 'Tungkalan' },
      { id: '11250167', code: '11250167', name: 'Ubalde' },
      { id: '11250168', code: '11250168', name: 'Ula' },
      { id: '11250169', code: '11250169', name: 'Waan' },
      { id: '11250170', code: '11250170', name: 'Wangan' }
    ],
    // Sample barangays for other major cities (you can add more as needed)
    '112401': [ // Tagum City
      { id: '11240101', code: '11240101', name: 'Apokon' },
      { id: '11240102', code: '11240102', name: 'Bincungan' },
      { id: '11240103', code: '11240103', name: 'Busaon' },
      { id: '11240104', code: '11240104', name: 'Canocotan' },
      { id: '11240105', code: '11240105', name: 'Cuambogan' },
      { id: '11240106', code: '11240106', name: 'La Filipina' },
      { id: '11240107', code: '11240107', name: 'Liboganon' },
      { id: '11240108', code: '11240108', name: 'Magdum' },
      { id: '11240109', code: '11240109', name: 'Magugpo East' },
      { id: '11240110', code: '11240110', name: 'Magugpo North' },
      { id: '11240111', code: '11240111', name: 'Magugpo Poblacion' },
      { id: '11240112', code: '11240112', name: 'Magugpo South' },
      { id: '11240113', code: '11240113', name: 'Magugpo West' },
      { id: '11240114', code: '11240114', name: 'Mankilam' },
      { id: '11240115', code: '11240115', name: 'Nueva Fuerza' },
      { id: '11240116', code: '11240116', name: 'Pagsabangan' },
      { id: '11240117', code: '11240117', name: 'Pandapan' },
      { id: '11240118', code: '11240118', name: 'San Agustin' },
      { id: '11240119', code: '11240119', name: 'San Miguel' },
      { id: '11240120', code: '11240120', name: 'Visayan Village' }
    ],
    // Add default empty array for cities without specific barangay data
    'default': [
      { id: 'default01', code: 'default01', name: 'Poblacion' },
      { id: 'default02', code: 'default02', name: 'San Jose' },
      { id: 'default03', code: 'default03', name: 'San Antonio' },
      { id: 'default04', code: 'default04', name: 'Santa Maria' },
      { id: 'default05', code: 'default05', name: 'San Pedro' }
    ]
  };

  // Fetch initial data
  useEffect(() => {
    // No need to fetch hospitals anymore since we use predefined list
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    if(formData.region) {
      const regionProvinces = provincesData[formData.region as keyof typeof provincesData] || [];
      setProvinces(regionProvinces);
      setCities([]);
      setBarangays([]);
    } else {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
    }
  }, [formData.region]);

  // Load cities when province changes
  useEffect(() => {
    if(formData.province) {
      const provinceCities = citiesData[formData.province as keyof typeof citiesData] || [];
      setCities(provinceCities);
      setBarangays([]);
    } else {
      setCities([]);
      setBarangays([]);
    }
  }, [formData.province]);

  // Load barangays when city changes
  useEffect(() => {
    if(formData.city) {
      const cityBarangays = barangaysData[formData.city as keyof typeof barangaysData] || barangaysData.default;
      setBarangays(cityBarangays);
    } else {
      setBarangays([]);
    }
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

    // Specialty validation for doctors
    if (formData.referrerType === 'doctor' && formData.specialties.length === 0) {
      toast({
        variant: "destructive",
        title: "Specialty Required",
        description: "Please select at least one medical specialty.",
      });
      return;
    }

    // Password validation for non-hospital accounts
    if (formData.referrerType !== 'hospital_account') {
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
    }

    setLoading(true);
    
    try {
      // For comprehensive registration, use FormData to handle file uploads
      const fd = new FormData();
      
      // Basic fields
      fd.append('username', formData.referrerType === 'hospital_account' ? formData.hospitalName : formData.username);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      fd.append('first_name', formData.firstName);
      fd.append('middle_name', formData.middleName);
      fd.append('last_name', formData.lastName);
      fd.append('referrer_type', formData.referrerType);
      
      // Additional fields
      if (formData.age) fd.append('age', String(formData.age));
      if (formData.gender) fd.append('gender', formData.gender);
      if (formData.position) fd.append('position', formData.position);
      
      // Address fields
      fd.append('region', formData.region || '');
      fd.append('province', formData.province || '');
      fd.append('city', formData.city || '');
      fd.append('barangay', formData.barangay || '');
      fd.append('address', formData.exactAddress || '');
      
      // Specialties and hospitals
      if (formData.referrerType === 'doctor') {
        const specialtyNames = [
          'Internal Medicine',
          'Pediatrics',
          'Obstetrics and Gynecology (OB-GYN)',
          'Surgery (General)',
          'Orthopedics',
          'Cardiology',
          'Ophthalmology (Eye Care)',
          'Otolaryngology (ENT-Head and Neck Surgery)',
          'Urology',
          'Neurology',
          'Oncology (Cancer Care)',
          'Pulmonology (Lung Care)',
          'Nephrology (Renal Care)',
          'Infectious Disease',
          'Rehabilitation Medicine'
        ];
        
        formData.specialties?.forEach((index: number) => {
          if (specialtyNames[index]) {
            fd.append('specialties', specialtyNames[index]);
          }
        });
      }
      
      // Hospital information
      if (formData.hospitalName) {
        fd.append('hospital_name', formData.hospitalName);
      } else if (formData.referrerType === 'doctor' && formData.affiliateHospitals.length > 0) {
        const hospitalNames = [
          'Gig Oca Robles Seamen\'s Hospital',
          'Davao Doctors Hospital',
          'San Pedro Hospital',
          'Metro Davao Medical and Research Center (MDMRC)',
          'United Davao Specialists Hospital',
          'DMSFI Hospital',
          'Our Lady of Lourdes Hospital'
        ];
        
        formData.affiliateHospitals?.forEach((index: number) => {
          if (hospitalNames[index]) {
            fd.append('affiliate_hospitals', hospitalNames[index]);
          }
        });
      }
      
      // Files
      if (files) {
        Array.from(files).forEach(f => fd.append('documents', f));
      }

      // Try the comprehensive registration endpoint first
      try {
        await authAPI.registerComprehensive(fd);
      } catch (error: any) {
        // Fallback to simple registration if comprehensive fails
        const simpleData = {
          username: formData.referrerType === 'hospital_account' ? formData.hospitalName : formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          profession: formData.referrerType === 'doctor' ? 'Doctor' : 
                     formData.referrerType === 'hospital_employee' ? 'Hospital Employee' : 
                     formData.referrerType === 'hospital_account' ? 'Hospital Account' : 'Other',
          cellphone: formData.cellphone || '000-000-0000',
          hospitalName: formData.hospitalName || 'Not specified',
          hospitalLocation: formData.exactAddress || formData.city || 'Not specified',
          isInsideDavao: formData.isInsideDavao,
        };
        
        await authAPI.register(simpleData);
      }
      
      toast({
        title: "Registration Successful! 🎉",
        description: "Your account has been created. You can now login to access your referrer dashboard.",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Referrer Registration</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create an account to submit referrals. Doctors must upload an official registered ID. Hospital accounts must upload legal documents.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Referrer Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Account Type
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referrer Type *
                </label>
                <select
                  name="referrerType"
                  value={formData.referrerType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="doctor">Doctor / Medical Professional</option>
                  <option value="hospital_employee">Authorized Hospital Employee</option>
                  <option value="hospital_account">Hospital Account</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Hospital Account Fields */}
            {formData.referrerType === 'hospital_account' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Hospital Information
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hospital Name / Username *
                  </label>
                  <textarea
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    placeholder="Enter hospital name"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hospital Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Hospital email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

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
                      placeholder="Password"
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
              </div>
            ) : (
              /* Individual Account Fields */
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Personal Information
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
                    placeholder="Username"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email (optional)"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      placeholder="Middle name"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Doctor-specific fields */}
                {formData.referrerType === 'doctor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Medical Specialties *
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Select a specialty from the dropdown to add it to your list. You can add multiple specialties.
                      </p>
                      
                      {/* Single Select Dropdown */}
                      <select
                        onChange={(e) => {
                          const selectedIndex = Number(e.target.value);
                          if (selectedIndex >= 0 && !formData.specialties.includes(selectedIndex)) {
                            setFormData(prev => ({
                              ...prev,
                              specialties: [...prev.specialties, selectedIndex]
                            }));
                          }
                          // Reset dropdown to placeholder
                          e.target.value = '';
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Select specialty</option>
                        {[
                          'Internal Medicine',
                          'Pediatrics',
                          'Obstetrics and Gynecology (OB-GYN)',
                          'Surgery (General)',
                          'Orthopedics',
                          'Cardiology',
                          'Ophthalmology (Eye Care)',
                          'Otolaryngology (ENT-Head and Neck Surgery)',
                          'Urology',
                          'Neurology',
                          'Oncology (Cancer Care)',
                          'Pulmonology (Lung Care)',
                          'Nephrology (Renal Care)',
                          'Infectious Disease',
                          'Rehabilitation Medicine'
                        ].map((specialty, index) => (
                          <option 
                            key={index} 
                            value={index}
                            disabled={formData.specialties.includes(index)}
                            className={formData.specialties.includes(index) ? 'text-gray-400' : ''}
                          >
                            {specialty} {formData.specialties.includes(index) ? '(Added)' : ''}
                          </option>
                        ))}
                      </select>
                      
                      {/* Selected Specialties Display */}
                      {formData.specialties.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Selected Specialties ({formData.specialties.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {formData.specialties.map((specialtyIndex) => {
                              const specialtyNames = [
                                'Internal Medicine',
                                'Pediatrics',
                                'Obstetrics and Gynecology (OB-GYN)',
                                'Surgery (General)',
                                'Orthopedics',
                                'Cardiology',
                                'Ophthalmology (Eye Care)',
                                'Otolaryngology (ENT-Head and Neck Surgery)',
                                'Urology',
                                'Neurology',
                                'Oncology (Cancer Care)',
                                'Pulmonology (Lung Care)',
                                'Nephrology (Renal Care)',
                                'Infectious Disease',
                                'Rehabilitation Medicine'
                              ];
                              return (
                                <span
                                  key={specialtyIndex}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                  {specialtyNames[specialtyIndex]}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        specialties: prev.specialties.filter(id => id !== specialtyIndex)
                                      }));
                                    }}
                                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Validation message */}
                      {formData.specialties.length === 0 && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                          Please select at least one specialty.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Affiliate Hospitals
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Select a hospital from the dropdown to add it to your list. You can add multiple hospitals.
                      </p>
                      
                      {/* Single Select Dropdown for Hospitals */}
                      <select
                        onChange={(e) => {
                          const selectedIndex = Number(e.target.value);
                          if (selectedIndex >= 0 && !formData.affiliateHospitals.includes(selectedIndex)) {
                            setFormData(prev => ({
                              ...prev,
                              affiliateHospitals: [...prev.affiliateHospitals, selectedIndex]
                            }));
                          }
                          // Reset dropdown to placeholder
                          e.target.value = '';
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Select hospital</option>
                        {[
                          'Gig Oca Robles Seamen\'s Hospital',
                          'Davao Doctors Hospital',
                          'San Pedro Hospital',
                          'Metro Davao Medical and Research Center (MDMRC)',
                          'United Davao Specialists Hospital',
                          'DMSFI Hospital',
                          'Our Lady of Lourdes Hospital'
                        ].map((hospital, index) => (
                          <option 
                            key={index} 
                            value={index}
                            disabled={formData.affiliateHospitals.includes(index)}
                            className={formData.affiliateHospitals.includes(index) ? 'text-gray-400' : ''}
                          >
                            {hospital} {formData.affiliateHospitals.includes(index) ? '(Added)' : ''}
                          </option>
                        ))}
                      </select>
                      
                      {/* Selected Hospitals Display */}
                      {formData.affiliateHospitals.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Selected Hospitals ({formData.affiliateHospitals.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {formData.affiliateHospitals.map((hospitalIndex) => {
                              const hospitalNames = [
                                'Gig Oca Robles Seamen\'s Hospital',
                                'Davao Doctors Hospital',
                                'San Pedro Hospital',
                                'Metro Davao Medical and Research Center (MDMRC)',
                                'United Davao Specialists Hospital',
                                'DMSFI Hospital',
                                'Our Lady of Lourdes Hospital'
                              ];
                              return (
                                <span
                                  key={hospitalIndex}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                >
                                  {hospitalNames[hospitalIndex]}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        affiliateHospitals: prev.affiliateHospitals.filter(id => id !== hospitalIndex)
                                      }));
                                    }}
                                    className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Additional fields for doctors and hospital employees */}
                {(formData.referrerType === 'doctor' || formData.referrerType === 'hospital_employee') && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Age
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="Age"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {formData.referrerType === 'hospital_employee' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Position / Role
                        </label>
                        <input
                          type="text"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          placeholder="Position / Role"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                {formData.referrerType === 'hospital_account' ? 'Hospital Address' : 'Address Information'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region {formData.referrerType === 'hospital_account' ? '*' : ''}
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    required={formData.referrerType === 'hospital_account'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Region</option>
                    {regionsData.map((r: any) => (
                      <option key={r.id || r.code} value={r.id || r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Province {formData.referrerType === 'hospital_account' ? '*' : ''}
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    required={formData.referrerType === 'hospital_account'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p: any) => (
                      <option key={p.id || p.code} value={p.id || p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City / Municipality {formData.referrerType === 'hospital_account' ? '*' : ''}
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required={formData.referrerType === 'hospital_account'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select City / Municipality</option>
                    {cities.map((c: any) => (
                      <option key={c.id || c.code} value={c.id || c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Barangay {formData.referrerType === 'hospital_account' ? '*' : ''}
                  </label>
                  <select
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleInputChange}
                    required={formData.referrerType === 'hospital_account'}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map((b: any) => (
                      <option key={b.id || b.code} value={b.id || b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exact Address {formData.referrerType === 'hospital_account' ? '*' : ''}
                </label>
                <textarea
                  name="exactAddress"
                  value={formData.exactAddress}
                  onChange={handleInputChange}
                  placeholder="House/Street, Building, etc."
                  required={formData.referrerType === 'hospital_account'}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Verification Documents
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {formData.referrerType === 'hospital_account' ? 'Upload Legal Documents *' : 'Upload Official ID *'}
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFiles}
                  required
                  className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.referrerType === 'hospital_account' 
                    ? 'Please upload any legal documents proving hospital validity.'
                    : 'Upload your official registered or Legal ID for verification.'
                  }
                </p>
              </div>
            </div>

            {/* Privacy Agreement */}
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
            >
              {loading ? "Creating Account..." : "Register"}
            </Button>
          </form>

          {/* Login Link */}
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