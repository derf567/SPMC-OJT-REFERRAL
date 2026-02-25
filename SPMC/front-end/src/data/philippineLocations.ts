// Philippine Regions, Provinces, Cities, and Barangays Data
// This file contains all location data for the hospital registration form

export interface LocationItem {
  id: string;
  code: string;
  name: string;
}

export const regionsData: LocationItem[] = [
  { id: '01', code: '01', name: 'Region I (Ilocos Region)' },
  { id: '02', code: '02', name: 'Region II (Cagayan Valley)' },
  { id: '03', code: '03', name: 'Region III (Central Luzon)' },
  { id: '04A', code: '04A', name: 'Region IV-A (CALABARZON)' },
  { id: '04B', code: '04B', name: 'Region IV-B (MIMAROPA)' },
  { id: '05', code: '05', name: 'Region V (Bicol Region)' },
  { id: '06', code: '06', name: 'Region VI (Western Visayas)' },
  { id: '07', code: '07', name: 'Region VII (Central Visayas)' },
  { id: '08', code: '08', name: 'Region VIII (Eastern Visayas)' },
  { id: '09', code: '09', name: 'Region IX (Zamboanga Peninsula)' },
  { id: '10', code: '10', name: 'Region X (Northern Mindanao)' },
  { id: '11', code: '11', name: 'Region XI (Davao Region)' },
  { id: '12', code: '12', name: 'Region XII (SOCCSKSARGEN)' },
  { id: '13', code: '13', name: 'Region XIII (Caraga)' },
  { id: 'NCR', code: 'NCR', name: 'NCR (National Capital Region)' },
  { id: 'CAR', code: 'CAR', name: 'CAR (Cordillera Administrative Region)' },
  { id: 'BARMM', code: 'BARMM', name: 'BARMM (Bangsamoro Autonomous Region)' }
];

export const provincesData: Record<string, LocationItem[]> = {
  '01': [
    { id: '0128', code: '0128', name: 'Ilocos Norte' },
    { id: '0129', code: '0129', name: 'Ilocos Sur' },
    { id: '0133', code: '0133', name: 'La Union' },
    { id: '0155', code: '0155', name: 'Pangasinan' }
  ],
  '02': [
    { id: '0215', code: '0215', name: 'Batanes' },
    { id: '0231', code: '0231', name: 'Cagayan' },
    { id: '0250', code: '0250', name: 'Isabela' },
    { id: '0257', code: '0257', name: 'Nueva Vizcaya' },
    { id: '0269', code: '0269', name: 'Quirino' }
  ],
  '03': [
    { id: '0308', code: '0308', name: 'Aurora' },
    { id: '0314', code: '0314', name: 'Bataan' },
    { id: '0321', code: '0321', name: 'Bulacan' },
    { id: '0349', code: '0349', name: 'Nueva Ecija' },
    { id: '0354', code: '0354', name: 'Pampanga' },
    { id: '0369', code: '0369', name: 'Tarlac' },
    { id: '0371', code: '0371', name: 'Zambales' }
  ],
  '04A': [
    { id: '0410', code: '0410', name: 'Batangas' },
    { id: '0421', code: '0421', name: 'Cavite' },
    { id: '0434', code: '0434', name: 'Laguna' },
    { id: '0456', code: '0456', name: 'Quezon' },
    { id: '0458', code: '0458', name: 'Rizal' }
  ],
  '04B': [
    { id: '1740', code: '1740', name: 'Marinduque' },
    { id: '1751', code: '1751', name: 'Occidental Mindoro' },
    { id: '1752', code: '1752', name: 'Oriental Mindoro' },
    { id: '1753', code: '1753', name: 'Palawan' },
    { id: '1759', code: '1759', name: 'Romblon' }
  ],
  '05': [
    { id: '0516', code: '0516', name: 'Albay' },
    { id: '0517', code: '0517', name: 'Camarines Norte' },
    { id: '0518', code: '0518', name: 'Camarines Sur' },
    { id: '0520', code: '0520', name: 'Catanduanes' },
    { id: '0541', code: '0541', name: 'Masbate' },
    { id: '0562', code: '0562', name: 'Sorsogon' }
  ],
  '06': [
    { id: '0619', code: '0619', name: 'Aklan' },
    { id: '0630', code: '0630', name: 'Antique' },
    { id: '0645', code: '0645', name: 'Capiz' },
    { id: '0679', code: '0679', name: 'Guimaras' },
    { id: '0630', code: '0630', name: 'Iloilo' },
    { id: '0645', code: '0645', name: 'Negros Occidental' }
  ],
  '07': [
    { id: '0722', code: '0722', name: 'Bohol' },
    { id: '0746', code: '0746', name: 'Cebu' },
    { id: '0761', code: '0761', name: 'Negros Oriental' },
    { id: '0762', code: '0762', name: 'Siquijor' }
  ],
  '08': [
    { id: '0826', code: '0826', name: 'Biliran' },
    { id: '0837', code: '0837', name: 'Eastern Samar' },
    { id: '0838', code: '0838', name: 'Leyte' },
    { id: '0848', code: '0848', name: 'Northern Samar' },
    { id: '0860', code: '0860', name: 'Samar (Western Samar)' },
    { id: '0864', code: '0864', name: 'Southern Leyte' }
  ],
  '09': [
    { id: '0972', code: '0972', name: 'Zamboanga del Norte' },
    { id: '0973', code: '0973', name: 'Zamboanga del Sur' },
    { id: '0983', code: '0983', name: 'Zamboanga Sibugay' }
  ],
  '10': [
    { id: '1013', code: '1013', name: 'Bukidnon' },
    { id: '1018', code: '1018', name: 'Camiguin' },
    { id: '1035', code: '1035', name: 'Lanao del Norte' },
    { id: '1042', code: '1042', name: 'Misamis Occidental' },
    { id: '1043', code: '1043', name: 'Misamis Oriental' }
  ],
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
  ],
  '13': [
    { id: '1360', code: '1360', name: 'Agusan del Norte' },
    { id: '1361', code: '1361', name: 'Agusan del Sur' },
    { id: '1367', code: '1367', name: 'Dinagat Islands' },
    { id: '1368', code: '1368', name: 'Surigao del Norte' },
    { id: '1369', code: '1369', name: 'Surigao del Sur' }
  ],
  'NCR': [
    { id: 'NCR01', code: 'NCR01', name: 'Metro Manila' }
  ],
  'CAR': [
    { id: '1401', code: '1401', name: 'Abra' },
    { id: '1411', code: '1411', name: 'Apayao' },
    { id: '1427', code: '1427', name: 'Benguet' },
    { id: '1432', code: '1432', name: 'Ifugao' },
    { id: '1444', code: '1444', name: 'Kalinga' },
    { id: '1481', code: '1481', name: 'Mountain Province' }
  ],
  'BARMM': [
    { id: '1503', code: '1503', name: 'Basilan' },
    { id: '1536', code: '1536', name: 'Lanao del Sur' },
    { id: '1538', code: '1538', name: 'Maguindanao' },
    { id: '1566', code: '1566', name: 'Sulu' },
    { id: '1570', code: '1570', name: 'Tawi-Tawi' }
  ]
};

export const citiesData: Record<string, LocationItem[]> = {
  // Region I - Ilocos Region
  '0128': [
    { id: '012801', code: '012801', name: 'Laoag City' },
    { id: '012802', code: '012802', name: 'Batac City' },
    { id: '012803', code: '012803', name: 'Pagudpud' },
    { id: '012804', code: '012804', name: 'Paoay' }
  ],
  '0129': [
    { id: '012901', code: '012901', name: 'Vigan City' },
    { id: '012902', code: '012902', name: 'Candon City' },
    { id: '012903', code: '012903', name: 'Santa' }
  ],
  '0133': [
    { id: '013301', code: '013301', name: 'San Fernando City' },
    { id: '013302', code: '013302', name: 'Bauang' },
    { id: '013303', code: '013303', name: 'San Juan' }
  ],
  '0155': [
    { id: '015501', code: '015501', name: 'Dagupan City' },
    { id: '015502', code: '015502', name: 'Alaminos City' },
    { id: '015503', code: '015503', name: 'San Carlos City' },
    { id: '015504', code: '015504', name: 'Urdaneta City' }
  ],
  // Region II - Cagayan Valley
  '0215': [{ id: '021501', code: '021501', name: 'Basco' }],
  '0231': [
    { id: '023101', code: '023101', name: 'Tuguegarao City' },
    { id: '023102', code: '023102', name: 'Aparri' }
  ],
  '0250': [
    { id: '025001', code: '025001', name: 'Ilagan City' },
    { id: '025002', code: '025002', name: 'Cauayan City' },
    { id: '025003', code: '025003', name: 'Santiago City' }
  ],
  '0257': [{ id: '025701', code: '025701', name: 'Bayombong' }],
  '0269': [{ id: '026901', code: '026901', name: 'Cabarroguis' }],
  // Region III - Central Luzon
  '0308': [{ id: '030801', code: '030801', name: 'Baler' }],
  '0314': [
    { id: '031401', code: '031401', name: 'Balanga City' },
    { id: '031402', code: '031402', name: 'Mariveles' }
  ],
  '0321': [
    { id: '032101', code: '032101', name: 'Malolos City' },
    { id: '032102', code: '032102', name: 'Meycauayan City' },
    { id: '032103', code: '032103', name: 'San Jose del Monte City' }
  ],
  '0349': [
    { id: '034901', code: '034901', name: 'Cabanatuan City' },
    { id: '034902', code: '034902', name: 'Gapan City' },
    { id: '034903', code: '034903', name: 'Palayan City' }
  ],
  '0354': [
    { id: '035401', code: '035401', name: 'Angeles City' },
    { id: '035402', code: '035402', name: 'San Fernando City' },
    { id: '035403', code: '035403', name: 'Mabalacat City' }
  ],
  '0369': [{ id: '036901', code: '036901', name: 'Tarlac City' }],
  '0371': [
    { id: '037101', code: '037101', name: 'Olongapo City' },
    { id: '037102', code: '037102', name: 'Subic' }
  ],
  // Region IV-A - CALABARZON
  '0410': [
    { id: '041001', code: '041001', name: 'Batangas City' },
    { id: '041002', code: '041002', name: 'Lipa City' },
    { id: '041003', code: '041003', name: 'Tanauan City' }
  ],
  '0421': [
    { id: '042101', code: '042101', name: 'Cavite City' },
    { id: '042102', code: '042102', name: 'Bacoor City' },
    { id: '042103', code: '042103', name: 'Dasmariñas City' },
    { id: '042104', code: '042104', name: 'Imus City' },
    { id: '042105', code: '042105', name: 'Tagaytay City' }
  ],
  '0434': [
    { id: '043401', code: '043401', name: 'Calamba City' },
    { id: '043402', code: '043402', name: 'San Pablo City' },
    { id: '043403', code: '043403', name: 'Santa Rosa City' },
    { id: '043404', code: '043404', name: 'Biñan City' }
  ],
  '0456': [
    { id: '045601', code: '045601', name: 'Lucena City' },
    { id: '045602', code: '045602', name: 'Tayabas City' }
  ],
  '0458': [
    { id: '045801', code: '045801', name: 'Antipolo City' },
    { id: '045802', code: '045802', name: 'Cainta' },
    { id: '045803', code: '045803', name: 'Taytay' }
  ],
  // Region IV-B - MIMAROPA
  '1740': [{ id: '174001', code: '174001', name: 'Boac' }],
  '1751': [{ id: '175101', code: '175101', name: 'San Jose' }],
  '1752': [{ id: '175201', code: '175201', name: 'Calapan City' }],
  '1753': [{ id: '175301', code: '175301', name: 'Puerto Princesa City' }],
  '1759': [{ id: '175901', code: '175901', name: 'Romblon' }],
  // Region V - Bicol Region
  '0516': [
    { id: '051601', code: '051601', name: 'Legazpi City' },
    { id: '051602', code: '051602', name: 'Ligao City' },
    { id: '051603', code: '051603', name: 'Tabaco City' }
  ],
  '0517': [{ id: '051701', code: '051701', name: 'Daet' }],
  '0518': [
    { id: '051801', code: '051801', name: 'Naga City' },
    { id: '051802', code: '051802', name: 'Iriga City' }
  ],
  '0520': [{ id: '052001', code: '052001', name: 'Virac' }],
  '0541': [{ id: '054101', code: '054101', name: 'Masbate City' }],
  '0562': [{ id: '056201', code: '056201', name: 'Sorsogon City' }],
  // Region VI - Western Visayas
  '0619': [{ id: '061901', code: '061901', name: 'Kalibo' }],
  '0630': [
    { id: '063001', code: '063001', name: 'Iloilo City' },
    { id: '063002', code: '063002', name: 'Passi City' },
    { id: '063003', code: '063003', name: 'San Jose' }
  ],
  '0645': [
    { id: '064501', code: '064501', name: 'Roxas City' },
    { id: '064502', code: '064502', name: 'Bacolod City' },
    { id: '064503', code: '064503', name: 'Silay City' }
  ],
  '0679': [{ id: '067901', code: '067901', name: 'Jordan' }],
  // Region VII - Central Visayas
  '0722': [{ id: '072201', code: '072201', name: 'Tagbilaran City' }],
  '0746': [
    { id: '074601', code: '074601', name: 'Cebu City' },
    { id: '074602', code: '074602', name: 'Mandaue City' },
    { id: '074603', code: '074603', name: 'Lapu-Lapu City' },
    { id: '074604', code: '074604', name: 'Talisay City' }
  ],
  '0761': [
    { id: '076101', code: '076101', name: 'Dumaguete City' },
    { id: '076102', code: '076102', name: 'Bais City' }
  ],
  '0762': [{ id: '076201', code: '076201', name: 'Siquijor' }],
  // Region VIII - Eastern Visayas
  '0826': [{ id: '082601', code: '082601', name: 'Naval' }],
  '0837': [{ id: '083701', code: '083701', name: 'Borongan City' }],
  '0838': [
    { id: '083801', code: '083801', name: 'Tacloban City' },
    { id: '083802', code: '083802', name: 'Ormoc City' }
  ],
  '0848': [{ id: '084801', code: '084801', name: 'Catarman' }],
  '0860': [
    { id: '086001', code: '086001', name: 'Calbayog City' },
    { id: '086002', code: '086002', name: 'Catbalogan City' }
  ],
  '0864': [{ id: '086401', code: '086401', name: 'Maasin City' }],
  // Region IX - Zamboanga Peninsula
  '0972': [
    { id: '097201', code: '097201', name: 'Dipolog City' },
    { id: '097202', code: '097202', name: 'Dapitan City' }
  ],
  '0973': [
    { id: '097301', code: '097301', name: 'Zamboanga City' },
    { id: '097302', code: '097302', name: 'Pagadian City' }
  ],
  '0983': [{ id: '098301', code: '098301', name: 'Ipil' }],
  // Region X - Northern Mindanao
  '1013': [
    { id: '101301', code: '101301', name: 'Malaybalay City' },
    { id: '101302', code: '101302', name: 'Valencia City' }
  ],
  '1018': [{ id: '101801', code: '101801', name: 'Mambajao' }],
  '1035': [{ id: '103501', code: '103501', name: 'Iligan City' }],
  '1042': [
    { id: '104201', code: '104201', name: 'Oroquieta City' },
    { id: '104202', code: '104202', name: 'Ozamiz City' },
    { id: '104203', code: '104203', name: 'Tangub City' }
  ],
  '1043': [
    { id: '104301', code: '104301', name: 'Cagayan de Oro City' },
    { id: '104302', code: '104302', name: 'Gingoog City' }
  ],
  // Region XI - Davao Region
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
  '1126': [
    { id: '112601', code: '112601', name: 'Malita' },
    { id: '112602', code: '112602', name: 'Don Marcelino' },
    { id: '112603', code: '112603', name: 'Jose Abad Santos' },
    { id: '112604', code: '112604', name: 'Santa Maria' }
  ],
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
  // Region XII - SOCCSKSARGEN
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
  '1248': [
    { id: '124801', code: '124801', name: 'Alabel' },
    { id: '124802', code: '124802', name: 'Glan' },
    { id: '124803', code: '124803', name: 'Kiamba' },
    { id: '124804', code: '124804', name: 'Maasim' },
    { id: '124805', code: '124805', name: 'Maitum' },
    { id: '124806', code: '124806', name: 'Malapatan' },
    { id: '124807', code: '124807', name: 'Malungon' }
  ],
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
  ],
  // Region XIII - Caraga
  '1360': [
    { id: '136001', code: '136001', name: 'Butuan City' },
    { id: '136002', code: '136002', name: 'Cabadbaran City' }
  ],
  '1361': [
    { id: '136101', code: '136101', name: 'Bayugan City' },
    { id: '136102', code: '136102', name: 'Prosperidad' }
  ],
  '1367': [{ id: '136701', code: '136701', name: 'San Jose' }],
  '1368': [{ id: '136801', code: '136801', name: 'Surigao City' }],
  '1369': [
    { id: '136901', code: '136901', name: 'Bislig City' },
    { id: '136902', code: '136902', name: 'Tandag City' }
  ],
  // NCR - National Capital Region
  'NCR01': [
    { id: 'NCR0101', code: 'NCR0101', name: 'Manila' },
    { id: 'NCR0102', code: 'NCR0102', name: 'Quezon City' },
    { id: 'NCR0103', code: 'NCR0103', name: 'Caloocan City' },
    { id: 'NCR0104', code: 'NCR0104', name: 'Las Piñas City' },
    { id: 'NCR0105', code: 'NCR0105', name: 'Makati City' },
    { id: 'NCR0106', code: 'NCR0106', name: 'Malabon City' },
    { id: 'NCR0107', code: 'NCR0107', name: 'Mandaluyong City' },
    { id: 'NCR0108', code: 'NCR0108', name: 'Marikina City' },
    { id: 'NCR0109', code: 'NCR0109', name: 'Muntinlupa City' },
    { id: 'NCR0110', code: 'NCR0110', name: 'Navotas City' },
    { id: 'NCR0111', code: 'NCR0111', name: 'Parañaque City' },
    { id: 'NCR0112', code: 'NCR0112', name: 'Pasay City' },
    { id: 'NCR0113', code: 'NCR0113', name: 'Pasig City' },
    { id: 'NCR0114', code: 'NCR0114', name: 'Pateros' },
    { id: 'NCR0115', code: 'NCR0115', name: 'San Juan City' },
    { id: 'NCR0116', code: 'NCR0116', name: 'Taguig City' },
    { id: 'NCR0117', code: 'NCR0117', name: 'Valenzuela City' }
  ],
  // CAR - Cordillera Administrative Region
  '1401': [{ id: '140101', code: '140101', name: 'Bangued' }],
  '1411': [{ id: '141101', code: '141101', name: 'Kabugao' }],
  '1427': [
    { id: '142701', code: '142701', name: 'Baguio City' },
    { id: '142702', code: '142702', name: 'La Trinidad' }
  ],
  '1432': [{ id: '143201', code: '143201', name: 'Lagawe' }],
  '1444': [{ id: '144401', code: '144401', name: 'Tabuk City' }],
  '1481': [{ id: '148101', code: '148101', name: 'Bontoc' }],
  // BARMM - Bangsamoro Autonomous Region
  '1503': [
    { id: '150301', code: '150301', name: 'Isabela City' },
    { id: '150302', code: '150302', name: 'Lamitan City' }
  ],
  '1536': [{ id: '153601', code: '153601', name: 'Marawi City' }],
  '1538': [{ id: '153801', code: '153801', name: 'Cotabato City' }],
  '1566': [{ id: '156601', code: '156601', name: 'Jolo' }],
  '1570': [{ id: '157001', code: '157001', name: 'Bongao' }]
};

export const barangaysData: Record<string, LocationItem[]> = {
  // NCR - Metro Manila Cities
  'NCR0101': [
    { id: 'NCR010101', code: 'NCR010101', name: 'Ermita' },
    { id: 'NCR010102', code: 'NCR010102', name: 'Intramuros' },
    { id: 'NCR010103', code: 'NCR010103', name: 'Malate' },
    { id: 'NCR010104', code: 'NCR010104', name: 'Paco' },
    { id: 'NCR010105', code: 'NCR010105', name: 'Pandacan' },
    { id: 'NCR010106', code: 'NCR010106', name: 'Port Area' },
    { id: 'NCR010107', code: 'NCR010107', name: 'Quiapo' },
    { id: 'NCR010108', code: 'NCR010108', name: 'Sampaloc' },
    { id: 'NCR010109', code: 'NCR010109', name: 'San Miguel' },
    { id: 'NCR010110', code: 'NCR010110', name: 'Santa Ana' },
    { id: 'NCR010111', code: 'NCR010111', name: 'Santa Cruz' },
    { id: 'NCR010112', code: 'NCR010112', name: 'Tondo' }
  ],
  'NCR0102': [
    { id: 'NCR010201', code: 'NCR010201', name: 'Bagong Pag-asa' },
    { id: 'NCR010202', code: 'NCR010202', name: 'Batasan Hills' },
    { id: 'NCR010203', code: 'NCR010203', name: 'Commonwealth' },
    { id: 'NCR010204', code: 'NCR010204', name: 'Cubao' },
    { id: 'NCR010205', code: 'NCR010205', name: 'Diliman' },
    { id: 'NCR010206', code: 'NCR010206', name: 'Fairview' },
    { id: 'NCR010207', code: 'NCR010207', name: 'Kamuning' },
    { id: 'NCR010208', code: 'NCR010208', name: 'Novaliches' },
    { id: 'NCR010209', code: 'NCR010209', name: 'Project 4' },
    { id: 'NCR010210', code: 'NCR010210', name: 'Tandang Sora' }
  ],
  'NCR0105': [
    { id: 'NCR010501', code: 'NCR010501', name: 'Bel-Air' },
    { id: 'NCR010502', code: 'NCR010502', name: 'Poblacion' },
    { id: 'NCR010503', code: 'NCR010503', name: 'San Lorenzo' },
    { id: 'NCR010504', code: 'NCR010504', name: 'Urdaneta' },
    { id: 'NCR010505', code: 'NCR010505', name: 'Valenzuela' }
  ],
  // Region XI - Davao City (comprehensive)
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
  '112401': [
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
  '074601': [
    { id: '07460101', code: '07460101', name: 'Apas' },
    { id: '07460102', code: '07460102', name: 'Banilad' },
    { id: '07460103', code: '07460103', name: 'Busay' },
    { id: '07460104', code: '07460104', name: 'Guadalupe' },
    { id: '07460105', code: '07460105', name: 'Lahug' },
    { id: '07460106', code: '07460106', name: 'Mabolo' },
    { id: '07460107', code: '07460107', name: 'Talamban' },
    { id: '07460108', code: '07460108', name: 'Tisa' }
  ],
  '104301': [
    { id: '10430101', code: '10430101', name: 'Balulang' },
    { id: '10430102', code: '10430102', name: 'Bulua' },
    { id: '10430103', code: '10430103', name: 'Carmen' },
    { id: '10430104', code: '10430104', name: 'Gusa' },
    { id: '10430105', code: '10430105', name: 'Kauswagan' },
    { id: '10430106', code: '10430106', name: 'Macasandig' },
    { id: '10430107', code: '10430107', name: 'Nazareth' },
    { id: '10430108', code: '10430108', name: 'Puerto' }
  ],
  '035401': [
    { id: '03540101', code: '03540101', name: 'Balibago' },
    { id: '03540102', code: '03540102', name: 'Cutcut' },
    { id: '03540103', code: '03540103', name: 'Pampang' },
    { id: '03540104', code: '03540104', name: 'Sto. Domingo' }
  ],
  '043401': [
    { id: '04340101', code: '04340101', name: 'Barandal' },
    { id: '04340102', code: '04340102', name: 'Bucal' },
    { id: '04340103', code: '04340103', name: 'Parian' },
    { id: '04340104', code: '04340104', name: 'Real' }
  ],
  'default': [
    { id: 'default01', code: 'default01', name: 'Poblacion' },
    { id: 'default02', code: 'default02', name: 'San Jose' },
    { id: 'default03', code: 'default03', name: 'San Antonio' },
    { id: 'default04', code: 'default04', name: 'Santa Maria' },
    { id: 'default05', code: 'default05', name: 'San Pedro' }
  ]
};
