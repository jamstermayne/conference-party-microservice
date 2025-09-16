/**
 * Professional Icon Microservice
 * Provides consistent, polished SVG icons for the entire platform
 */

export interface IconConfig {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export class IconService {
  private static instance: IconService;
  private readonly defaultSize = 24;
  private readonly defaultColor = 'currentColor';
  private readonly defaultStrokeWidth = 2;

  private constructor() {}

  static getInstance(): IconService {
    if (!IconService.instance) {
      IconService.instance = new IconService();
    }
    return IconService.instance;
  }

  /**
   * Get icon as SVG string
   */
  getIcon(name: string, config?: IconConfig): string {
    const icon = this.icons[name];
    if (!icon) {
      console.warn(`Icon "${name}" not found`);
      return this.icons.placeholder(config);
    }
    return typeof icon === 'function' ? icon(config) : icon;
  }

  /**
   * Get icon as data URI for embedding
   */
  getDataUri(name: string, config?: IconConfig): string {
    const svg = this.getIcon(name, config);
    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml,${encoded}`;
  }

  /**
   * Professional icon library
   */
  private icons: Record<string, (config?: IconConfig) => string> = {
    // People & Profiles
    user: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    users: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    userCheck: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 11L19 13L23 9" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // Business & Companies
    building: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M3 21H21" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 21V7L12 3V21" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 21V11L12 7" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 9V9.01" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 12V12.01" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 15V15.01" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 18V18.01" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    briefcase: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // Matching & Networking
    target: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <circle cx="12" cy="12" r="10" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="6" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="2" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    handshake: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M12 5H8.5C7.83696 5 7.20107 5.26339 6.73223 5.73223C6.26339 6.20107 6 6.83696 6 7.5C6 8.16304 6.26339 8.79893 6.73223 9.26777C7.20107 9.73661 7.83696 10 8.5 10H12" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 10H15.5C16.163 10 16.7989 10.2634 17.2678 10.7322C17.7366 11.2011 18 11.837 18 12.5C18 13.163 17.7366 13.7989 17.2678 14.2678C16.7989 14.7366 16.163 15 15.5 15H12" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 12C21 11 20 9 18.5 9C18.5 9 17.5 10 16.5 10C15.5 10 14.5 9 14.5 9C13 9 12 11 12 12C12 11 11 9 9.5 9C9.5 9 8.5 10 7.5 10C6.5 10 5.5 9 5.5 9C4 9 3 11 3 12" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 12V17C3 18.5 4 20 6 20H18C20 20 21 18.5 21 17V12" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    network: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <circle cx="12" cy="5" r="3" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}"/>
        <circle cx="5" cy="19" r="3" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}"/>
        <circle cx="19" cy="19" r="3" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}"/>
        <path d="M10.5 7.5L6.5 16.5" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <path d="M13.5 7.5L17.5 16.5" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <path d="M8 19H16" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
      </svg>
    `,

    // Communication
    message: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    messageSquare: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // Analytics & Data
    trendingUp: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="17 6 23 6 23 12" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    barChart: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <line x1="12" y1="20" x2="12" y2="10" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="18" y1="20" x2="18" y2="4" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="6" y1="20" x2="6" y2="16" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    pieChart: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M21.21 15.89C20.5738 17.3945 19.5788 18.7202 18.3119 19.7513C17.0449 20.7825 15.5447 21.4874 13.9424 21.8048C12.3401 22.1222 10.6844 22.0421 9.12012 21.5718C7.55585 21.1014 6.1306 20.2551 4.96902 19.1067C3.80745 17.9582 2.94479 16.5428 2.45661 14.9839C1.96843 13.4251 1.86954 11.7705 2.16857 10.1646C2.46761 8.55878 3.15547 7.05063 4.17202 5.77203C5.18857 4.49343 6.50286 3.48302 8.00006 2.83" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7362 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.76121C14.6136 2.25866 13.3132 2 12 2V12H22Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // Events & Calendar
    calendar: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    clock: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <circle cx="12" cy="12" r="10" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="12 6 12 12 16 14" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    mapPin: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="10" r="3" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // Actions
    search: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <circle cx="11" cy="11" r="8" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 21L16.65 16.65" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    filter: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    sparkles: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M12 2L13.09 8.26L19 7L15.45 11.82L21 16L14.81 16.78L16 23L10.91 18.74L6 20L7.45 13.18L2 9L8.19 8.22L7 2L12 2Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // Status Indicators
    checkCircle: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7089 16.9033 20.9725 14.8354 21.5839C12.7674 22.1952 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="22 4 12 14.01 9 11.01" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    alertCircle: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <circle cx="12" cy="12" r="10" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="16" x2="12.01" y2="16" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    activity: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // Casino/Vegas Theme
    dice: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}"/>
        <circle cx="8" cy="8" r="1.5" fill="${config?.color || this.defaultColor}"/>
        <circle cx="16" cy="8" r="1.5" fill="${config?.color || this.defaultColor}"/>
        <circle cx="8" cy="16" r="1.5" fill="${config?.color || this.defaultColor}"/>
        <circle cx="16" cy="16" r="1.5" fill="${config?.color || this.defaultColor}"/>
        <circle cx="12" cy="12" r="1.5" fill="${config?.color || this.defaultColor}"/>
      </svg>
    `,

    trophy: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <path d="M6 9H4C3.46957 9 2.96086 8.78929 2.58579 8.41421C2.21071 8.03914 2 7.53043 2 7V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H6" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18 9H20C20.5304 9 21.0391 8.78929 21.4142 8.41421C21.7893 8.03914 22 7.53043 22 7V4C22 3.46957 21.7893 2.96086 21.4142 2.58579C21.0391 2.21071 20.5304 2 20 2H18" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 2H18V11C18 12.5913 17.3679 14.1174 16.2426 15.2426C15.1174 16.3679 13.5913 17 12 17C10.4087 17 8.88258 16.3679 7.75736 15.2426C6.63214 14.1174 6 12.5913 6 11V2Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 17V22" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 22H16" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    star: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    // Technology
    cpu: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}"/>
        <rect x="9" y="9" width="6" height="6" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}"/>
        <line x1="9" y1="1" x2="9" y2="4" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <line x1="15" y1="1" x2="15" y2="4" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <line x1="9" y1="20" x2="9" y2="23" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <line x1="15" y1="20" x2="15" y2="23" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <line x1="20" y1="9" x2="23" y2="9" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <line x1="20" y1="14" x2="23" y2="14" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <line x1="1" y1="9" x2="4" y2="9" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
        <line x1="1" y1="14" x2="4" y2="14" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round"/>
      </svg>
    `,

    code: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <polyline points="16 18 22 12 16 6" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="8 6 2 12 8 18" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    globe: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <circle cx="12" cy="12" r="10" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="2" y1="12" x2="22" y2="12" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,

    placeholder: (config) => `
      <svg width="${config?.size || this.defaultSize}" height="${config?.size || this.defaultSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="${config?.className || ''}">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="${config?.color || this.defaultColor}" stroke-width="${config?.strokeWidth || this.defaultStrokeWidth}" stroke-dasharray="3 3"/>
      </svg>
    `
  };

  /**
   * Get all available icon names
   */
  getIconNames(): string[] {
    return Object.keys(this.icons);
  }

  /**
   * Generate icon sprite sheet for performance
   */
  generateSpriteSheet(): string {
    const icons = this.getIconNames();
    const sprites = icons.map(name => {
      const svg = this.getIcon(name);
      return `<symbol id="icon-${name}">${svg.replace(/<svg[^>]*>|<\/svg>/g, '')}</symbol>`;
    }).join('\n');

    return `
      <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
        ${sprites}
      </svg>
    `;
  }
}

// Export singleton instance
export const iconService = IconService.getInstance();

// Helper function for easy access
export function getIcon(name: string, config?: IconConfig): string {
  return iconService.getIcon(name, config);
}

// React component wrapper (if using React)
export function Icon({ name, ...config }: { name: string } & IconConfig) {
  return <div dangerouslySetInnerHTML={{ __html: getIcon(name, config) }} />;
}