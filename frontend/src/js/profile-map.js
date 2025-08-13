/**
 * profile-map.js
 * Map provider raw payloads -> unified profile shape for the app.
 * Unified shape:
 * {
 *   name, email, avatar, headline, company, role, linkedinUrl,
 *   source: 'linkedin'|'google'|'email'|null
 * }
 */
export function mapLinkedInProfile(raw) {
  if (!raw) return null;
  // Defensive parsing for LinkedIn v2 (people profile)
  const first = raw.firstName?.localized ? Object.values(raw.firstName.localized)[0] : raw.firstName || '';
  const last  = raw.lastName?.localized ? Object.values(raw.lastName.localized)[0] : raw.lastName || '';
  const name  = [first, last].filter(Boolean).join(' ').trim() || raw.localizedFirstName && raw.localizedLastName
    ? `${raw.localizedFirstName} ${raw.localizedLastName}`.trim()
    : (raw.name || '').trim();

  // Email may arrive from separate endpoint; accept injected raw.email if present
  const email = raw.email || raw.primaryEmail || null;

  // Headline / company
  const headline = raw.headline?.localized ? Object.values(raw.headline.localized)[0] : (raw.headline || null);
  const company  = raw.company || raw.positionCompany || null;

  // Photo
  let avatar = null;
  try {
    const elements = raw.profilePicture?.['displayImage~']?.elements || raw.profilePicture?.elements || [];
    const best = elements[elements.length - 1];
    avatar = best?.identifiers?.[0]?.identifier || best?.identifier || null;
  } catch { /* noop */ }

  // Role: prefer custom mapping (e.g., "Speaker", "Publisher", etc.) if provided upstream; else derive from headline lightly
  let role = raw.role || null;
  if (!role && headline) {
    const h = headline.toLowerCase();
    if (h.includes('speaker')) role = 'Speaker';
    else if (h.includes('investor')) role = 'Investor';
    else if (h.includes('publisher')) role = 'Publisher';
    else if (h.includes('developer')) role = 'Developer';
  }

  const linkedinUrl = raw.publicProfileUrl || raw.vanityName ? `https://www.linkedin.com/in/${raw.vanityName}` : (raw.linkedinUrl || null);

  return {
    name: name || null,
    email: email || null,
    avatar: avatar || null,
    headline: headline || null,
    company: company || null,
    role: role || null,
    linkedinUrl: linkedinUrl || null,
    source: 'linkedin'
  };
}

export function normalizeProfileFallbacks(existing = {}) {
  // Ensure predictable keys for template safety
  return {
    name: existing.name || 'Your Name',
    email: existing.email || null,
    avatar: existing.avatar || null,
    headline: existing.headline || null,
    company: existing.company || null,
    role: existing.role || null,
    linkedinUrl: existing.linkedinUrl || null,
    source: existing.source || null
  };
}