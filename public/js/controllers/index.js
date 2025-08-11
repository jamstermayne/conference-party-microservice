/**
 * CONTROLLERS INDEX
 * Export all controllers for easy importing
 */

export { BaseController } from './BaseController.js';
export { AppController } from './AppController.js';
export { EventController } from './EventController.js';
export { SearchController } from './SearchController.js';
export { NetworkingController } from './NetworkingController.js';
export { HomeController } from './HomeController.js';
export { PeopleController } from './PeopleController.js';
export { OpportunitiesController } from './OpportunitiesController.js';
export { MeController } from './MeController.js';
export { InviteController } from './InviteController.js';
export { CalendarController } from './CalendarController.js';

// Default export is the AppController singleton
import appController from './AppController.js';
export default appController;