/**
 * PSA PSGC API Service
 * Philippine Standard Geographic Code API integration
 * API Documentation: https://psgc.cloud/api-docs
 */

const PSA_API_BASE = 'https://psgc.cloud/api';

export interface Region {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
}

export interface CityMunicipality {
  code: string;
  name: string;
  type?: string;
  district?: string;
  zip_code?: string;
}

export interface Barangay {
  code: string;
  name: string;
  status?: string;
}

/**
 * Fetch all regions
 */
export const fetchRegions = async (): Promise<Region[]> => {
  try {
    const response = await fetch(`${PSA_API_BASE}/regions`);
    if (!response.ok) throw new Error('Failed to fetch regions');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
};

/**
 * Fetch all provinces
 */
export const fetchAllProvinces = async (): Promise<Province[]> => {
  try {
    const response = await fetch(`${PSA_API_BASE}/provinces`);
    if (!response.ok) throw new Error('Failed to fetch provinces');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
};

/**
 * Fetch provinces by region code (filtered client-side)
 */
export const fetchProvinces = async (regionCode: string): Promise<Province[]> => {
  try {
    const allProvinces = await fetchAllProvinces();
    // Filter provinces by region code (first 2 digits of province code match region code)
    return allProvinces.filter(p => p.code.startsWith(regionCode.substring(0, 2)));
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
};

/**
 * Fetch all cities
 */
export const fetchAllCities = async (): Promise<CityMunicipality[]> => {
  try {
    const response = await fetch(`${PSA_API_BASE}/cities`);
    if (!response.ok) throw new Error('Failed to fetch cities');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

/**
 * Fetch all municipalities
 */
export const fetchAllMunicipalities = async (): Promise<CityMunicipality[]> => {
  try {
    const response = await fetch(`${PSA_API_BASE}/municipalities`);
    if (!response.ok) throw new Error('Failed to fetch municipalities');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching municipalities:', error);
    return [];
  }
};

/**
 * Fetch cities/municipalities by province code
 * Special handling for independent cities (like Davao City)
 */
export const fetchCitiesMunicipalities = async (provinceCode: string): Promise<CityMunicipality[]> => {
  try {
    const [cities, municipalities] = await Promise.all([
      fetchAllCities(),
      fetchAllMunicipalities()
    ]);
    
    const all = [...cities, ...municipalities];
    
    // Get the region code (first 2 digits)
    const regionCode = provinceCode.substring(0, 2);
    
    // Filter by province code (first 4 digits match)
    let filtered = all.filter(c => c.code.startsWith(provinceCode.substring(0, 4)));
    
    // For Region 11 (Davao Region), ALWAYS include Davao City regardless of province
    if (regionCode === '11') {
      const davaoCity = all.find(c => 
        c.name.toLowerCase() === 'city of davao' || 
        c.name.toLowerCase() === 'davao city'
      );
      
      if (davaoCity && !filtered.find(c => c.code === davaoCity.code)) {
        // Add Davao City at the beginning of the list
        filtered = [davaoCity, ...filtered];
      }
    }
    
    return filtered;
  } catch (error) {
    console.error('Error fetching cities/municipalities:', error);
    return [];
  }
};

// Cache for barangays to avoid repeated large API calls
let barangaysCache: Barangay[] | null = null;
let barangaysCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all barangays (with caching due to large dataset)
 */
export const fetchAllBarangays = async (): Promise<Barangay[]> => {
  try {
    // Check cache first
    const now = Date.now();
    if (barangaysCache && (now - barangaysCacheTime) < CACHE_DURATION) {
      console.log('Using cached barangays');
      return barangaysCache;
    }
    
    console.log('Fetching barangays from API...');
    const response = await fetch(`${PSA_API_BASE}/barangays`);
    
    if (!response.ok) {
      console.error(`Barangays API error: ${response.status} ${response.statusText}`);
      
      // If we have cached data, return it even if expired
      if (barangaysCache) {
        console.log('API failed, using expired cache');
        return barangaysCache;
      }
      
      throw new Error(`Failed to fetch barangays: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully loaded ${data.length} barangays`);
    
    // Update cache
    barangaysCache = data;
    barangaysCacheTime = now;
    
    return data;
  } catch (error) {
    console.error('Error fetching barangays:', error);
    
    // Return cached data if available, even if expired
    if (barangaysCache) {
      console.log('Error occurred, using cached data');
      return barangaysCache;
    }
    
    return [];
  }
};

/**
 * Fetch barangays by city/municipality code
 * Uses caching to improve performance
 */
export const fetchBarangays = async (cityMunicipalityCode: string): Promise<Barangay[]> => {
  try {
    console.log('Fetching barangays for city code:', cityMunicipalityCode);
    
    const allBarangays = await fetchAllBarangays();
    
    if (!allBarangays || allBarangays.length === 0) {
      console.error('No barangays loaded from API');
      return [];
    }
    
    console.log('Total barangays loaded:', allBarangays.length);
    
    // The city code is 10 digits (e.g., 1130700000)
    // Barangay codes are 9 digits and should match the first 7 digits of the city code
    const prefix = cityMunicipalityCode.substring(0, 7);
    
    console.log('Filtering with prefix (7 digits):', prefix);
    console.log('Sample barangay codes:', allBarangays.slice(0, 5).map(b => ({ code: b.code, name: b.name })));
    
    const filtered = allBarangays.filter(b => b.code.startsWith(prefix));
    
    console.log('Filtered barangays found:', filtered.length);
    if (filtered.length > 0) {
      console.log('Sample filtered barangays:', filtered.slice(0, 3).map(b => ({ code: b.code, name: b.name })));
    }
    
    return filtered;
  } catch (error) {
    console.error('Error fetching barangays:', error);
    return [];
  }
};

/**
 * Fetch all data for a specific region (for caching/offline use)
 */
export const fetchRegionData = async (regionCode: string) => {
  try {
    const provinces = await fetchProvinces(regionCode);
    const citiesPromises = provinces.map(p => fetchCitiesMunicipalities(p.code));
    const cities = await Promise.all(citiesPromises);
    
    return {
      provinces,
      cities: cities.flat()
    };
  } catch (error) {
    console.error('Error fetching region data:', error);
    return { provinces: [], cities: [] };
  }
};
