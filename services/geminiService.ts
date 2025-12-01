// AI services have been disabled.
export const polishContent = async (text: string): Promise<string> => {
  return text;
};

export const analyzeMood = async (text: string): Promise<any> => {
  return { sentiment: '未知', emoji: '🤔', color: '#e5e7eb' };
};

export const generateWeeklySummary = async (logs: any[]): Promise<any> => {
  return { 
    concise: "",
    detailed: "",
    highlights: [], 
    moodSummary: "" 
  };
};