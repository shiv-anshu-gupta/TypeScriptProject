/**
 * Who is making this request, and from where.
 *
 * @remarks
 * A tiny module on purpose. The permission gate writes the actor; the audit
 * trail reads it. Keeping the store here rather than in either of them stops
 * the two from importing each other, which is a cycle Node resolves by handing
 * one of them a half-built module.
 *
 * The value is held in a `WeakMap` keyed by the request, so it disappears with
 * the request and nothing has to remember to clear it.
 *
 * @packageDocumentation
 */
import type { Request } from "express";
import { clientIpFromHeaders } from "../utils/clientIp";

/**
 * The caller, as resolved once per request from the database.
 *
 * @remarks
 * `role` is a snapshot of the moment the request was authorised. The audit
 * trail copies it rather than joining to the `User` later, so a person who is
 * demoted next month still appears in the log as who they were.
 */
export type Actor = {
  /** The `User` document id, as a string. */
  id: string;
  /** Their email at the time, lowercased. */
  email: string;
  /** The role they held at the time. */
  role: string;
  /** The address the request came from, or `""` if unreadable. */
  ip: string;
};

const actors = new WeakMap<Request, Actor>();

/**
 * Remembers who this request belongs to.
 *
 * @param req - The Express request.
 * @param actor - The resolved caller.
 */
export function setActor(req: Request, actor: Actor): void {
  actors.set(req, actor);
}

/**
 * The caller of this request, once a permission gate has run.
 *
 * @param req - The Express request.
 * @returns The actor, or `undefined` when no gate has run - which for an
 * `/admin` route means the request never got this far.
 */
export function actorOf(req: Request): Actor | undefined {
  return actors.get(req);
}

/**
 * The address this request came from.
 *
 * @remarks
 * Falls back to the socket's own address, which is meaningful only when the
 * server runs with no proxy in front of it, as in local development.
 *
 * @param req - The Express request.
 * @returns The caller's address, or `""` when it cannot be read. Never throws:
 * an unreadable address is a failed network check, not a failed request.
 */
export function ipOf(req: Request): string {
  return clientIpFromHeaders(req.headers) ?? req.socket?.remoteAddress ?? "";
}

/**
 * The role the caller holds, for a route that needs to shape its response.
 *
 * @param req - The Express request.
 * @returns The role resolved by the permission gate, or `"user"` when none has
 * run. Defaulting to the least-privileged role means a response built before
 * the gate is redacted, not leaked.
 */
export function roleOf(req: Request): string {
  return actors.get(req)?.role ?? "user";
}
