/**
 * CONTROLLERS INDEX
 * Export all controllers for easy importing
 */

export { BaseController } from './BaseController.js?v=b011';
export { AppController } from './AppController.js?v=b011';
export { EventController } from './EventController.js?v=b011';
export { SearchController } from './SearchController.js?v=b011';
export { NetworkingController } from './NetworkingController.js?v=b011';
export { HomeController } from './HomeController.js?v=b011';
export { PeopleController } from './PeopleController.js?v=b011';
export { OpportunitiesController } from './OpportunitiesController.js?v=b011';
export { MeController } from './MeController.js?v=b011';
export { InviteController } from './InviteController.js?v=b011';
export { CalendarController } from './CalendarController.js?v=b011';

// Default export is the AppController singleton
import appController from './AppController.js?v=b011';
export default appController;