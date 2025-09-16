/**
 * Service Registry
 * Manages microservice discovery and health checks
 */

import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

interface Service {
  name: string;
  url: string;
  prefix: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck?: Date;
  timeout: number;
  retries: number;
}

export class ServiceRegistry {
  private services: Map<string, Service>;
  private healthCheckInterval?: NodeJS.Timer;

  constructor() {
    this.services = new Map();
  }

  /**
   * Register all services
   */
  async registerServices(): Promise<void> {
    for (const [name, serviceConfig] of Object.entries(config.services)) {
      this.registerService({
        name,
        url: serviceConfig.url,
        prefix: serviceConfig.prefix,
        status: 'unknown',
        timeout: serviceConfig.timeout,
        retries: serviceConfig.retries,
      });
    }

    // Start health checks
    await this.performHealthChecks();
    this.startHealthCheckInterval();
  }

  /**
   * Register a single service
   */
  registerService(service: Service): void {
    this.services.set(service.name, service);
    logger.info(`Service registered: ${service.name}`, { url: service.url });
  }

  /**
   * Get service by name
   */
  getService(name: string): Service | undefined {
    return this.services.get(name);
  }

  /**
   * Get all services
   */
  getServices(): Service[] {
    return Array.from(this.services.values());
  }

  /**
   * Perform health checks
   */
  async performHealthChecks(): Promise<void> {
    const checks = Array.from(this.services.values()).map(async (service) => {
      try {
        const response = await axios.get(`${service.url}/health`, {
          timeout: 3000,
        });

        service.status = response.status === 200 ? 'healthy' : 'unhealthy';
        service.lastCheck = new Date();
      } catch (error) {
        service.status = 'unhealthy';
        service.lastCheck = new Date();
        logger.warn(`Health check failed for ${service.name}`, { error });
      }
    });

    await Promise.all(checks);
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheckInterval(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  /**
   * Deregister all services
   */
  async deregisterAll(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.services.clear();
    logger.info('All services deregistered');
  }

  /**
   * Get service URL for routing
   */
  getServiceUrl(name: string): string | null {
    const service = this.services.get(name);
    if (!service || service.status === 'unhealthy') {
      return null;
    }
    return service.url;
  }

  /**
   * Check if service is healthy
   */
  isServiceHealthy(name: string): boolean {
    const service = this.services.get(name);
    return service?.status === 'healthy';
  }
}