export const sanitizeInput = (text = "") => {
    const value = String(text ?? "");
    return value.replace(/[<>]/g, "").trim();
};