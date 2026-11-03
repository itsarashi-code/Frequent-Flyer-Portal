export const sanitizeInput = (text = "") => {
  return text.replace(/[<>]/g, "");
};