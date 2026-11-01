import {
  PlayerDTO,
  InputState,
  ObstacleDTO,
  MonsterDTO,
  PlayerClass,
  CombatFeedback
} from '../types/index.js';

export enum MessageType {
  WELCOME = 'welcome',
  INPUT = 'input',
  WORLD_STATE = 'world_state',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  SELECT_CLASS = 'select_class',
  SELECT_TARGET = 'select_target',
  CAST_SPELL = 'cast_spell',
  COMBAT_FEEDBACK = 'combat_feedback',
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

export interface SelectClassMessage {
  type: MessageType.SELECT_CLASS;
  classType: PlayerClass;
}

export interface SelectTargetMessage {
  type: MessageType.SELECT_TARGET;
  targetId: string | null;
}

export interface CastSpellMessage {
  type: MessageType.CAST_SPELL;
  spellId: string;
  targetId?: string | null;
}

export interface CombatFeedbackMessage {
  type: MessageType.COMBAT_FEEDBACK;
  feedbacks: CombatFeedback[];
}

export interface WorldStateMessage {
  type: MessageType.WORLD_STATE;
  tick: number;
  timestamp: number;
  players: PlayerDTO[];
  monsters: MonsterDTO[];
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
  | SelectClassMessage
  | SelectTargetMessage
  | CastSpellMessage
  | CombatFeedbackMessage
  | WorldStateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PingMessage
  | PongMessage;
