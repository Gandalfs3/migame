import { GameWorld } from './game/GameWorld.js';
import { NetworkServer } from './network/NetworkServer.js';
import { DEFAULT_SERVER_PORT } from '@migame/common';

const PORT = Number(process.env.PORT) || DEFAULT_SERVER_PORT;

const world = new GameWorld();
const server = new NetworkServer(world, PORT);

server.start().catch((err) => {
  console.error('[Fatal Server Error]', err);
  process.exit(1);
});
