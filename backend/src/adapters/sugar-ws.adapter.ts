import { WsAdapter } from '@nestjs/platform-ws';

/**
 * Thin wrapper kept for future customisation.
 * The frontend now speaks the native NestJS WS protocol
 * { event: "event_name", data: {...} } so no override is needed.
 */
export class SugarWsAdapter extends WsAdapter {}
