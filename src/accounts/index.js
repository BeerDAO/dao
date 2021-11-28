import { Actor } from "@dfinity/agent";
import { idlFactory } from './accounts.did.js';

export const canisterId = "45pum-byaaa-aaaam-aaanq-cai";

export const createActor = (agent) => {
  if (process.env.NEXT_PUBLIC_DFX_NETWORK === "local") {
    agent.fetchRootKey();
  }
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};