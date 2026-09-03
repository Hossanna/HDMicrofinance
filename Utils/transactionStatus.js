const mapProviderStatus = (providerStatus) => {
  if (providerStatus === "ok") return "successful";
  if (providerStatus === "error") return "failed";
  return "unknown";
};

module.exports = mapProviderStatus;
