export interface HealthCheckResult {
  selector: string;
  healthy: boolean;
  count: number;
  consecutiveFailures: number;
  lastChecked: Date;
}

export class SelectorHealth {
  private healthMap = new Map<string, { 
    failures: number; 
    lastCheck: Date;
    lastHealthy: Date | null;
  }>();

  check(selector: string, root: Element = document.body): HealthCheckResult {
    const elements = root.querySelectorAll(selector);
    const count = elements.length;
    const healthy = count > 0;
    
    const record = this.healthMap.get(selector) || { 
      failures: 0, 
      lastCheck: new Date(),
      lastHealthy: null 
    };
    
    if (healthy) {
      record.failures = 0;
      record.lastHealthy = new Date();
    } else {
      record.failures++;
    }
    record.lastCheck = new Date();
    
    this.healthMap.set(selector, record);
    
    return {
      selector,
      healthy,
      count,
      consecutiveFailures: record.failures,
      lastChecked: record.lastCheck
    };
  }

  getHealth(selector: string): HealthCheckResult | null {
    const record = this.healthMap.get(selector);
    if (!record) return null;
    
    return {
      selector,
      healthy: record.failures === 0,
      count: 0,
      consecutiveFailures: record.failures,
      lastChecked: record.lastCheck
    };
  }

  getUnhealthySelectors(): string[] {
    const unhealthy: string[] = [];
    this.healthMap.forEach((record, selector) => {
      if (record.failures >= 3) {
        unhealthy.push(selector);
      }
    });
    return unhealthy;
  }

  resetAll(): void {
    this.healthMap.clear();
  }
}
