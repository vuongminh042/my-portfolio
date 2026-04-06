export function getUserRoom(userId) {
  return `user:${userId}`;
}

export function getThreadRoom(threadId) {
  return `chat:${threadId}`;
}

export function getRoomSize(io, room) {
  return io?.sockets?.adapter?.rooms?.get(room)?.size || 0;
}

export function roomHasConnections(io, room) {
  return getRoomSize(io, room) > 0;
}

export function emitChatUpdate(io, { threadId, userId, payload = {} }) {
  if (!io || !threadId) return;

  const event = {
    threadId: String(threadId),
    ...payload,
  };

  io.to('admins').emit('chat:updated', event);

  if (userId) {
    io.to(getUserRoom(userId)).emit('chat:updated', event);
  }
}
