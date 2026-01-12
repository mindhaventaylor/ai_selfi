/**
 * Normalizes and hashes a string using SHA-256
 * Used for Google Ads Enhanced Conversions
 */
export async function sha256(value: string): Promise<string> {
  let normalizedValue = value.trim().toLowerCase();
  
  // Gmail normalization: remove dots from the local part of gmail addresses
  if (normalizedValue.endsWith('@gmail.com') || normalizedValue.endsWith('@googlemail.com')) {
    const [local, domain] = normalizedValue.split('@');
    normalizedValue = local.replace(/\./g, '') + '@' + domain;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedValue);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
