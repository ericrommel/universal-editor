// Response header for the production shell. Vite preview sends this.
// A static host has to send the same value. frame-ancestors is not
// honored in a meta tag, so the header is the control.
export const productionPolicy =
  "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
