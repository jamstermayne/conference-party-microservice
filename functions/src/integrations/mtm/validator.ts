/**
 * Validate and test ICS URL
 */
export async function validateIcsUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  // Check URL format
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Invalid URL provided' };
  }
  
  // Must be HTTPS
  if (!url.startsWith('https://')) {
    return { valid: false, error: 'URL must use HTTPS' };
  }
  
  // Must end with .ics or contain /calendar (for MTM query params)
  if (!url.endsWith('.ics') && !url.includes('/calendar')) {
    return { valid: false, error: 'URL must end with .ics or contain /calendar' };
  }
  
  // Test if URL is reachable with HEAD request (3s timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Conference-Party-App/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok && response.status !== 405) { // Some servers don't support HEAD
      // Try a small range GET as fallback
      const rangeResponse = await fetch(url, {
        headers: {
          'Range': 'bytes=0-100',
          'User-Agent': 'Conference-Party-App/1.0'
        },
        signal: AbortSignal.timeout(3000)
      });
      
      if (!rangeResponse.ok) {
        return { valid: false, error: `Server returned ${rangeResponse.status}` };
      }
    }
    
    return { valid: true };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { valid: false, error: 'URL request timed out' };
    }
    return { valid: false, error: 'URL is not reachable' };
  }
}