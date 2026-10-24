
// JWT utility functions
const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production-123"; // Production mein env variable se lo

export const createJWT = (payload) => {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  
  // Simple signature
  const signature = btoa(
    Array.from(base64Header + '.' + base64Payload)
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ JWT_SECRET.charCodeAt(i % JWT_SECRET.length)))
      .join('')
  );
  
  return `${base64Header}.${base64Payload}.${signature}`;
};

export const verifyJWT = (token) => {
  try {
    const [header, payload, signature] = token.split('.');
    
    // Verify signature
    const expectedSignature = btoa(
      Array.from(header + '.' + payload)
        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ JWT_SECRET.charCodeAt(i % JWT_SECRET.length)))
        .join('')
    );
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    return JSON.parse(atob(payload));
  } catch (e) {
    console.error("JWT verification failed:", e);
    return null;
  }
};

export const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const jwt = createJWT(value); // JWT create karo
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${name}=${jwt};expires=${expires.toUTCString()};path=/;SameSite=Lax${isSecure ? ';Secure' : ''}`;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const jwt = c.substring(nameEQ.length, c.length);
      return verifyJWT(jwt); // JWT verify aur decode karo
    }
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};
