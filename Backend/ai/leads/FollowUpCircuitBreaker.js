/**
 * FollowUpCircuitBreaker.js
 * Scoped circuit breaker preventing API hammering during provider outages or credential revocation.
 */

class FollowUpCircuitBreaker {
  constructor() {
    this.circuits = new Map(); // connectionId -> { failures, lastFailureTime, state: "CLOSED"|"OPEN"|"HALF_OPEN" }
    this.FAILURE_THRESHOLD = 5;
    this.COOLDOWN_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
  }

  getCircuit(connectionId) {
    const key = String(connectionId || "global");
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        failures: 0,
        lastFailureTime: null,
        state: "CLOSED",
      });
    }
    return this.circuits.get(key);
  }

  isAllowed(connectionId) {
    const circuit = this.getCircuit(connectionId);
    const now = Date.now();

    if (circuit.state === "OPEN") {
      if (circuit.lastFailureTime && now - circuit.lastFailureTime > this.COOLDOWN_PERIOD_MS) {
        circuit.state = "HALF_OPEN";
        return { allowed: true, state: "HALF_OPEN", reason: "TESTING_RECOVERY" };
      }
      return { allowed: false, state: "OPEN", reason: "CIRCUIT_BREAKER_OPEN_PROVIDER_OUTAGE" };
    }

    return { allowed: true, state: circuit.state, reason: "NORMAL_OPERATION" };
  }

  recordSuccess(connectionId) {
    const circuit = this.getCircuit(connectionId);
    circuit.failures = 0;
    circuit.state = "CLOSED";
  }

  recordFailure(connectionId, error) {
    const circuit = this.getCircuit(connectionId);
    circuit.failures += 1;
    circuit.lastFailureTime = Date.now();

    if (circuit.failures >= this.FAILURE_THRESHOLD) {
      circuit.state = "OPEN";
      console.warn(`[FollowUpCircuitBreaker] Circuit OPEN for connection '${connectionId}'. Consecutive failures: ${circuit.failures}`);
    }
  }

  reset(connectionId) {
    const key = String(connectionId || "global");
    this.circuits.delete(key);
  }
}

module.exports = new FollowUpCircuitBreaker();
