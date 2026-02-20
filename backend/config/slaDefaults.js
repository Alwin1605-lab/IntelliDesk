const slaDefaults = {
  Critical: {
    responseMinutes: parseInt(process.env.SLA_CRITICAL_RESPONSE) || 15,
    resolutionMinutes: parseInt(process.env.SLA_CRITICAL_RESOLUTION) || 120,
  },
  High: {
    responseMinutes: parseInt(process.env.SLA_HIGH_RESPONSE) || 30,
    resolutionMinutes: parseInt(process.env.SLA_HIGH_RESOLUTION) || 480,
  },
  Medium: {
    responseMinutes: parseInt(process.env.SLA_MEDIUM_RESPONSE) || 60,
    resolutionMinutes: parseInt(process.env.SLA_MEDIUM_RESOLUTION) || 1440,
  },
  Low: {
    responseMinutes: parseInt(process.env.SLA_LOW_RESPONSE) || 240,
    resolutionMinutes: parseInt(process.env.SLA_LOW_RESOLUTION) || 2880,
  },
};

module.exports = slaDefaults;
