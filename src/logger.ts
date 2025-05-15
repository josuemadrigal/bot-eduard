// logger.ts
import chalk from "chalk";

type LogLevel = "debug" | "info" | "warn" | "error" | "none";

export class Logger {
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4,
  };

  constructor(level: LogLevel = "info") {
    this.level = level;
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    return this.levels[messageLevel] >= this.levels[this.level];
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.log(
        chalk.gray(`[${this.getTimestamp()}] [DEBUG]`),
        chalk.gray(message),
        ...args
      );
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.log(
        chalk.blue(`[${this.getTimestamp()}] [INFO]`),
        chalk.white(message),
        ...args
      );
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.log(
        chalk.yellow(`[${this.getTimestamp()}] [WARN]`),
        chalk.yellow(message),
        ...args
      );
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(
        chalk.red(`[${this.getTimestamp()}] [ERROR]`),
        chalk.red(message),
        ...args
      );
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}
