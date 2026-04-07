declare module 'socket.io' {
  import { EventEmitter } from 'events';

  interface SocketOptions {
    cors?: Record<string, unknown>;
    transports?: string[];
  }

  export interface Server extends EventEmitter {
    on(event: string, callback: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    close(): void;
    of(nsp: string): any;
    sockets: Map<string, any>;
    use(middleware: (...args: any[]) => any): this;
    attach(httpServer: any, opts?: Record<string, unknown>): this;
    listen(port: number, opts?: Record<string, unknown>): this;
  }

  export interface Socket extends EventEmitter {
    id: string;
    on(event: string, callback: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    join(room: string): this;
    leave(room: string): this;
    to(room: string): any;
    connect(): void;
    disconnect(): void;
    connected: boolean;
    handshake: {
      query: Record<string, unknown>;
      auth: Record<string, unknown>;
    };
    data: Record<string, unknown>;
    rooms: Set<string>;
  }

  export function Server(opts?: SocketOptions): Server;
}

declare module 'socket.io-client' {
  export function io(url: string, opts?: Record<string, unknown>): Socket;
  export interface Socket {
    id?: string;
    on(event: string, callback: (...args: any[]) => void): Socket;
    emit(event: string, ...args: any[]): Socket;
    connect(): Socket;
    disconnect(): Socket;
    connected: boolean;
    io: any;
  }
}
