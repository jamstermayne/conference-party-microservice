/**
 * BASE CONTROLLER CLASS
 * Foundation for all controllers in the Professional Intelligence Platform
 */

import { Store } from '../store.js?v=b023';
import { Events } from '../events.js?v=b023';
import { motion } from '../ui/motion.js?v=b023';

export class BaseController {
  constructor(element, options = {}) {
    this.element = element || document.querySelector(`[data-route="${this.name}"]`);
    this.name = options.name || this.constructor.name.replace('Controller', '').toLowerCase();
    this.state = {};
    this.subscriptions = [];
    this.eventListeners = [];
    this.initialized = false;
    this.destroyed = false;
  }

  /**
   * Lifecycle: Initialize controller
   */
  async init() {
    if (this.initialized) return;
    
    try {
      console.log(`🎮 Initializing ${this.name} controller`);
      
      await this.beforeInit();
      await this.onInit();
      await this.afterInit();
      
      this.initialized = true;
      this.emit('controller:initialized', { controller: this.name });
      
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.name} controller:`, error);
      this.handleError(error);
    }
  }

  /**
   * Lifecycle: Before initialization hook
   */
  async beforeInit() {
    this.setupEventListeners();
    this.setupStoreSubscriptions();
  }

  /**
   * Lifecycle: Main initialization - override in child classes
   */
  async onInit() {
    // Override in child controllers
  }

  /**
   * Lifecycle: After initialization hook
   */
  async afterInit() {
    this.setupAnimations();
    this.render();
  }

  /**
   * Lifecycle: Render view
   */
  render() {
    if (!this.element) return;
    
    const data = this.getData();
    const html = this.template(data);
    
    if (html) {
      this.element.innerHTML = html;
      this.bindEvents();
      this.animateIn();
    }
  }

  /**
   * Template method - override in child classes
   */
  template(data) {
    return '';
  }

  /**
   * Get data for rendering
   */
  getData() {
    return {
      ...this.state,
      store: Store.state
    };
  }

  /**
   * Update controller state
   */
  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    this.onStateChange(this.state, oldState);
    this.render();
  }

  /**
   * State change hook - override in child classes
   */
  onStateChange(newState, oldState) {
    // Override in child controllers
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Delegate events from element
    if (this.element) {
      this.delegateEvent('click', '[data-action]', this.handleAction.bind(this));
      this.delegateEvent('submit', 'form', this.handleSubmit.bind(this));
      this.delegateEvent('change', 'input, select', this.handleChange.bind(this));
    }
    
    // Global events
    this.on('route:change', this.handleRouteChange.bind(this));
  }

  /**
   * Delegate event from element
   */
  delegateEvent(eventType, selector, handler) {
    if (!this.element) return;
    
    const listener = (e) => {
      const target = e.target.closest(selector);
      if (target && this.element.contains(target)) {
        handler(e, target);
      }
    };
    
    this.element.addEventListener(eventType, listener);
    this.eventListeners.push({ element: this.element, type: eventType, listener });
  }

  /**
   * Handle action events
   */
  handleAction(e, target) {
    e.preventDefault();
    const action = target.dataset.action;
    const method = `action${action.charAt(0).toUpperCase()}${action.slice(1)}`;
    
    if (typeof this[method] === 'function') {
      this[method](e, target);
    } else {
      console.warn(`Action method ${method} not found in ${this.name} controller`);
    }
  }

  /**
   * Handle form submission
   */
  handleSubmit(e, form) {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    const submitMethod = form.dataset.submit;
    if (submitMethod && typeof this[submitMethod] === 'function') {
      this[submitMethod](data, form);
    } else {
      this.onSubmit(data, form);
    }
  }

  /**
   * Handle input changes
   */
  handleChange(e, input) {
    const name = input.name || input.id;
    const value = input.type === 'checkbox' ? input.checked : input.value;
    
    if (name) {
      this.setState({ [name]: value });
    }
    
    this.onChange(name, value, input);
  }

  /**
   * Form submit hook - override in child classes
   */
  onSubmit(data, form) {
    // Override in child controllers
  }

  /**
   * Input change hook - override in child classes
   */
  onChange(name, value, input) {
    // Override in child controllers
  }

  /**
   * Handle route changes
   */
  handleRouteChange({ route }) {
    if (route === this.name) {
      this.onEnter();
    } else {
      this.onLeave();
    }
  }

  /**
   * Route enter hook
   */
  onEnter() {
    if (this.element) {
      this.element.hidden = false;
      this.animateIn();
    }
  }

  /**
   * Route leave hook
   */
  onLeave() {
    if (this.element) {
      this.element.hidden = true;
    }
  }

  /**
   * Setup store subscriptions
   */
  setupStoreSubscriptions() {
    // Override in child controllers to subscribe to specific store paths
  }

  /**
   * Subscribe to store changes
   */
  subscribe(path, callback) {
    const unsubscribe = Store.subscribe(path, callback);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    const unsubscribe = Events.on(event, callback);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Emit event
   */
  emit(event, data) {
    Events.emit(event, data);
  }

  /**
   * Setup animations
   */
  setupAnimations() {
    if (!this.element) return;
    
    motion.setupIntersectionObservers();
    this.element.querySelectorAll('[data-motion]').forEach(el => {
      motion.observe(el);
    });
  }

  /**
   * Animate elements in
   */
  animateIn() {
    if (!this.element) return;
    
    motion.animate(this.element, {
      opacity: [0, 1],
      transform: ['translateY(20px)', 'translateY(0)']
    }, { duration: 300 });
  }

  /**
   * Find element within controller scope
   */
  $(selector) {
    return this.element ? this.element.querySelector(selector) : null;
  }

  /**
   * Find all elements within controller scope
   */
  $$(selector) {
    return this.element ? Array.from(this.element.querySelectorAll(selector)) : [];
  }

  /**
   * Load data from API
   */
  async loadData(endpoint, options = {}) {
    try {
      const response = await fetch(endpoint, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Handle errors
   */
  handleError(error) {
    console.error(`[${this.name}]`, error);
    this.emit('error', { controller: this.name, error });
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.element) {
      this.element.classList.add('is-loading');
    }
    Store.actions.showLoading();
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.element) {
      this.element.classList.remove('is-loading');
    }
    Store.actions.hideLoading();
  }

  /**
   * Show notification
   */
  notify(message, type = 'info') {
    Store.actions.showNotification({ message, type });
  }

  /**
   * Lifecycle: Destroy controller
   */
  destroy() {
    if (this.destroyed) return;
    
    console.log(`🧹 Destroying ${this.name} controller`);
    
    this.beforeDestroy();
    this.onDestroy();
    this.afterDestroy();
    
    this.destroyed = true;
    this.initialized = false;
    
    this.emit('controller:destroyed', { controller: this.name });
  }

  /**
   * Before destroy hook
   */
  beforeDestroy() {
    // Cleanup subscriptions
    this.subscriptions.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.subscriptions = [];
    
    // Cleanup event listeners
    this.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener);
    });
    this.eventListeners = [];
  }

  /**
   * Main destroy - override in child classes
   */
  onDestroy() {
    // Override in child controllers
  }

  /**
   * After destroy hook
   */
  afterDestroy() {
    this.state = {};
    this.element = null;
  }

  /**
   * Utility: Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Utility: Throttle function
   */
  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Utility: Format date
   */
  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  }
}