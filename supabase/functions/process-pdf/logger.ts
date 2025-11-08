export interface LogEntry {
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  phase: string;
  message: string;
  data?: any;
}

export class Logger {
  private logs: LogEntry[] = [];
  private universeId: string;

  constructor(universeId: string) {
    this.universeId = universeId;
  }

  info(phase: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'INFO',
      phase,
      message,
      data,
    };
    this.logs.push(entry);
    console.log(`[${phase}] ${message}`, data ? JSON.stringify(data) : '');
  }

  warn(phase: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'WARN',
      phase,
      message,
      data,
    };
    this.logs.push(entry);
    console.warn(`[${phase}] ${message}`, data ? JSON.stringify(data) : '');
  }

  error(phase: string, message: string, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'ERROR',
      phase,
      message,
      data: error,
    };
    this.logs.push(entry);
    console.error(`[${phase}] ${message}`, error);
  }

  debug(phase: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'DEBUG',
      phase,
      message,
      data,
    };
    this.logs.push(entry);
    console.debug(`[${phase}] ${message}`, data ? JSON.stringify(data) : '');
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  getSummary() {
    return {
      totalLogs: this.logs.length,
      errors: this.logs.filter(l => l.level === 'ERROR').length,
      warnings: this.logs.filter(l => l.level === 'WARN').length,
      phases: [...new Set(this.logs.map(l => l.phase))],
    };
  }
}
