/**
 * Circuit Breaker
 * Prevents cascading failures in microservices
 */

import { config } from '../config';
import { logger } from '../utils/logger';

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  state: CircuitState;
}

export class CircuitBreaker {
  private circuits: Map<string, CircuitStats>;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly requestTimeout: number;

  constructor() {
    this.circuits = new Map();
    this.failureThreshold = config.circuitBreaker.failureThreshold;
    this.resetTimeout = config.circuitBreaker.resetTimeout;
    this.requestTimeout = config.circuitBreaker.requestTimeout;
  }

  /**
   * Execute request with circuit breaker protection
   */
  async execute<T>(
    service: string,
    request: () => Promise<T>
  ): Promise<T> {
    const circuit = this.getCircuit(service);

    // Check if circuit is open
    if (circuit.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset(circuit)) {
        circuit.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error(`Circuit breaker is OPEN for service: ${service}`);
      }
    }

    try {
      // Execute request with timeout
      const result = await this.executeWithTimeout(request);

      // Record success
      this.onSuccess(service, circuit);

      return result;
    } catch (error) {
      // Record failure
      this.onFailure(service, circuit);

      throw error;
    }
  }

  /**
   * Get circuit for service
   */
  private getCircuit(service: string): CircuitStats {
    if (!this.circuits.has(service)) {
      this.circuits.set(service, {
        failures: 0,
        successes: 0,
        state: CircuitState.CLOSED,
      });
    }
    return this.circuits.get(service)!;
  }

  /**
   * Handle successful request
   */
  private onSuccess(service: string, circuit: CircuitStats): void {
    circuit.failures = 0;
    circuit.successes++;

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.state = CircuitState.CLOSED;
      logger.info(`Circuit breaker CLOSED for service: ${service}`);
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(service: string, circuit: CircuitStats): void {
    circuit.failures++;
    circuit.lastFailureTime = new Date();

    if (circuit.failures >= this.failureThreshold) {
      circuit.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker OPEN for service: ${service}`, {
        failures: circuit.failures,
      });
    }
  }

  /**
   * Check if should attempt reset
   */
  private shouldAttemptReset(circuit: CircuitStats): boolean {
    if (!circuit.lastFailureTime) {
      return false;
    }

    const timeSinceLastFailure =
      Date.now() - circuit.lastFailureTime.getTime();

    return timeSinceLastFailure >= this.resetTimeout;
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    request: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, this.requestTimeout);

      request()
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get circuit status
   */
  getStatus(service: string): CircuitStats | undefined {
    return this.circuits.get(service);
  }

  /**
   * Reset circuit
   */
  reset(service: string): void {
    const circuit = this.getCircuit(service);
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.state = CircuitState.CLOSED;
    circuit.lastFailureTime = undefined;
  }

  /**
   * Get all circuit statuses
   */
  getAllStatuses(): Map<string, CircuitStats> {
    return new Map(this.circuits);
  }
}