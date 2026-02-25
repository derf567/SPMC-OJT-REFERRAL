/**
 * PSA PSGC API Service
 * Philippine Standard Geographic Code API integration
 * API Documentation: https://psa.gov.ph/classifications-api/psgc
 */

const PSA_API_BASE = 'https://psgc-api.azurewebsites.net/api';

export interface Region {
  code: string;
  name: string;
  regionName: string;
}

export interface Province {
  code: string;
  name: string;
  regionCode: string;
}

export interface CityMunicipality {
  code: string;
  name: string;
  provinceCode: string;
  isCity: boolean;
  isCapital: boolean;
}

export interface Barangay {
  code: string;
  name: string;
  cityMunicipalityCode: string;
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
 * Fetch provinces by region code
 */
export const fetchProvinces = async (regionCode: string): Promise<Province[]> => {
  try {
    const response = await fetch(`${PSA_API_BASE}/provinces?regionCode=${regionCode}`);
    if (!response.ok) throw new Error('Failed to fetch provinces');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
};

/**
 * Fetch cities/municipalities by province code
 */
export const fetchCitiesMunicipalities = async (provinceCode: string): Promise<CityMunicipality[]> => {
  try {
    const response = await fetch(`${PSA_API_BASE}/cities-municipalities?provinceCode=${provinceCode}`);
    if (!response.ok) throw new Error('Failed to fetch cities/municipalities');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cities/municipalities:', error);
    return [];
  }
};

/**
 * Fetch barangays by city/municipality code
 */
export const fetchBarangays = async (cityMunicipalityCode: string): Promise<Barangay[]> => {
  try {
    const response = await fetch(`${PSA_API_BASE}/barangays?citymunCode=${cityMunicipalityCode}`);
    if (!response.ok) throw new Error('Failed to fetch barangays');
    const data = await response.json();
    return data;
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
