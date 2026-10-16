export const generatePassword = (length: number = 16, includeSymbols: boolean = true): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
  const finalCharset = includeSymbols ? charset + symbols : charset;
  
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * finalCharset.length);
    password += finalCharset[randomIndex];
  }
  return password;
};