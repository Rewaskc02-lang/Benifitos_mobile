const citizenService = require("./citizenService");

exports.generateAssistantResponse = async ({
  citizenId = citizenService.DEFAULT_CITIZEN_ID,
  message,
}) => {
  const profile = await citizenService.getCitizenProfile(citizenId);
  const stage = profile?.stage || "citizen";
  const income = profile?.income || 0;

  return {
    answer: `I have analyzed your active profile graph layer. As a ${stage} with an annual household income of ₹${income}, your dashboard values are now optimized. Check your Missed Benefits tab for matching items.`,
  };
};
