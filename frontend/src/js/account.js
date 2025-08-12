// account.js
import { renderAccount as renderAccountController } from './account-controller.js';

export function renderAccount(root) {
  // Delegate to the full account controller
  renderAccountController(root);
}

export default { renderAccount };