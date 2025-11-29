import { BadRequestError } from "../helpers/api-errors"

export function validateCoordinates(latitude: number, longitude: number) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new BadRequestError("Coordinates must be numbers")
  }

  if (latitude < -90 || latitude > 90) {
    throw new BadRequestError("Invalid latitude")
  }

  if (longitude < -180 || longitude > 180) {
    throw new BadRequestError("Invalid longitude")
  }

  if (latitude === 0 && longitude === 0) {
    throw new BadRequestError("Invalid coordinate reference (0,0)")
  }

  // Optional: restrict to Brazil
  const isBrazil =
    latitude >= -34 && latitude <= 5 &&
    longitude >= -74 && longitude <= -29

  if (!isBrazil) {
    throw new BadRequestError("Coordinates must be inside Brazil")
  }
}
