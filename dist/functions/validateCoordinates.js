"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoordinates = void 0;
const api_errors_1 = require("../helpers/api-errors");
function validateCoordinates(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new api_errors_1.BadRequestError("Coordinates must be numbers");
    }
    if (latitude < -90 || latitude > 90) {
        throw new api_errors_1.BadRequestError("Invalid latitude");
    }
    if (longitude < -180 || longitude > 180) {
        throw new api_errors_1.BadRequestError("Invalid longitude");
    }
    if (latitude === 0 && longitude === 0) {
        throw new api_errors_1.BadRequestError("Invalid coordinate reference (0,0)");
    }
    // Optional: restrict to Brazil
    const isBrazil = latitude >= -34 && latitude <= 5 &&
        longitude >= -74 && longitude <= -29;
    if (!isBrazil) {
        throw new api_errors_1.BadRequestError("Coordinates must be inside Brazil");
    }
}
exports.validateCoordinates = validateCoordinates;
