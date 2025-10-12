declare module 'midi' {
  export class Input {
    constructor();
    getPortCount(): number;
    getPortName(port: number): string;
    openPort(port: number): void;
    closePort(): void;
    on(event: 'message', callback: (deltaTime: number, message: number[]) => void): void;
  }
}
