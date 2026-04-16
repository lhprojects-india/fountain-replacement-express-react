import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Extract and categorize vehicle type from fountainData.data.mot
 * Checks multiple paths since fountainData structure may vary
 * @param {Object} fountainData - The fountainData object from user data
 * @param {boolean} debug - Whether to log debug information
 * @returns {string} - "van" or "car"
 */
export function getVehicleTypeFromMOT(fountainData, debug = false) {
  void debug;

  // Check if fountainData exists
  if (!fountainData) {
    return "car";
  }

  // Try multiple paths for MOT data (webhook structure can vary)
  let mot = null;
  const pathsToCheck = [
    () => fountainData.data?.mot,                    // Primary: fountainData.data.mot
    () => fountainData.mot,                           // Direct: fountainData.mot
    () => fountainData.applicant?.data?.mot,          // Nested: fountainData.applicant.data.mot
    () => fountainData.data?.vehicle_type,            // Alternative: data.vehicle_type
    () => fountainData.vehicle_type,                  // Direct: vehicle_type
    () => fountainData.vehicle,                       // Direct: vehicle
    () => fountainData.applicant?.data?.vehicle_type, // Nested: applicant.data.vehicle_type
  ];

  for (const getPath of pathsToCheck) {
    try {
      const value = getPath();
      if (value) {
        mot = String(value).toLowerCase().trim();
        break;
      }
    } catch (e) {
      // Continue to next path if this one fails
    }
  }
  
  // If we found MOT or vehicle data, process it
  if (mot) {
    // Van category - check for "van" (case-insensitive)
    if (mot.includes("van")) {
      return "van";
    }
    
    // Car categories: SUV, 7 seater (with variations), Hatchback, Sedan, Saloon, Estate
    const carTypes = [
      "suv",
      "7 seater", "7-seater", "7seater",
      "hatchback",
      "sedan",
      "saloon",
      "estate"
    ];
    
    for (const carType of carTypes) {
      // Remove spaces and dashes for comparison to handle variations
      const normalizedMot = mot.replace(/[\s-]/g, "");
      const normalizedCarType = carType.replace(/[\s-]/g, "");
      if (normalizedMot.includes(normalizedCarType)) {
        return "car";
      }
    }
    
    // If mot contains vehicle info but doesn't match specific types, default to car
    return "car";
  }
  
  // Default to "car" if MOT data is not available
  return "car";
}
