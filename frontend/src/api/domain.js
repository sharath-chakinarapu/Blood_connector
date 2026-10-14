const bloodGroupToApi = {
  "A+": "A_POSITIVE",
  "A-": "A_NEGATIVE",
  "B+": "B_POSITIVE",
  "B-": "B_NEGATIVE",
  "AB+": "AB_POSITIVE",
  "AB-": "AB_NEGATIVE",
  "O+": "O_POSITIVE",
  "O-": "O_NEGATIVE",
};

export const bloodGroups = Object.keys(bloodGroupToApi);

export function toApiBloodGroup(value) {
  return bloodGroupToApi[value] || value;
}

export function fromApiBloodGroup(value) {
  return Object.entries(bloodGroupToApi).find(([, apiValue]) => apiValue === value)?.[0] || value || "";
}

export function fromApiRole(value) {
  return value === "HOSPITAL" ? "hospital" : value === "DONOR" ? "donor" : "";
}

export function displayRequestStatus(value) {
  return value ? value.toLowerCase() : "";
}

export function getDonorEligibility(profile, now = new Date()) {
  if (!profile?.available) {
    return { eligible: false, reason: "Your donor availability is turned off." };
  }
  if (!profile.lastDonationDate) {
    return { eligible: true, reason: "" };
  }

  const donationDate = profile.lastDonationDate.slice(0, 10);
  const eligibleDate = new Date(`${donationDate}T00:00:00.000Z`);
  if (Number.isNaN(eligibleDate.getTime())) {
    return { eligible: false, reason: "Your last donation date needs to be checked in your profile." };
  }
  eligibleDate.setUTCDate(eligibleDate.getUTCDate() + 90);
  const today = now.toISOString().slice(0, 10);
  const eligibleOn = eligibleDate.toISOString().slice(0, 10);

  if (eligibleOn > today) {
    return {
      eligible: false,
      reason: `Your last donation was recorded on ${donationDate}. Matching becomes available on ${eligibleOn}, after the 90-day recovery period.`,
      eligibleOn,
    };
  }
  return { eligible: true, reason: "" };
}

export function apiErrorMessage(error, fallback) {
  const body = error.response?.data;
  if (typeof body === "string" && body.trim()) return body;
  if (body?.error) return body.error;
  if (body?.message) return body.message;
  if (error.response?.status === 401) return "Your session has expired. Please sign in again.";
  if (error.response?.status === 403) return "Your account does not have permission to perform this action.";
  if (error.response?.status === 404) return "The requested item could not be found.";
  if (!error.response) return "Could not reach the Java API. Check the configured API URL and try again.";
  return fallback;
}
