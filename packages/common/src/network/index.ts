import { PlayerDTO, InputState, ObstacleDTO } from '../types/index.js';

export enum MessageType {
  WELCOME = 'welcome',
  INPUT = 'input',
  WORLD_STATE = 'world_state',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  PING = 'ping',
  PONG = 'pong'
}

export interface WelcomeMessage {
  type: MessageType.WELCOME;
  playerId: string;
  hostIp: string;
  port: number;
  color: string;
  mapBound: number;
  obstacles: ObstacleDTO[];
}

export interface InputMessage extends InputState {
  type: MessageType.INPUT;
}

export interface WorldStateMessage {
  type: MessageType.WORLD_STATE;
  tick: number;
  timestamp: number;
  players: PlayerDTO[];
}

export interface PlayerJoinedMessage {
  type: MessageType.PLAYER_JOINED;
  player: PlayerDTO;
}

export interface PlayerLeftMessage {
  type: MessageType.PLAYER_LEFT;
  playerId: string;
}

export interface PingMessage {
  type: MessageType.PING;
  clientTime: number;
}

export interface PongMessage {
  type: MessageType.PONG;
  clientTime: number;
}

export type NetworkMessage =
  | WelcomeMessage
  | InputMessage
  | WorldStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PingMessage
  | PongMessage;
