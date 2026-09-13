/**
 * JSON-safe DTOs for /api/messages (CONTRACT v1).
 */

/**
 * @param {object} doc — lean Message or mongoose doc
 * @returns {{
 *   _id: string,
 *   propertyId: string,
 *   senderId: string,
 *   recipientId: string,
 *   name: string,
 *   email: string,
 *   phone?: string,
 *   body: string,
 *   read: boolean,
 *   createdAt: string,
 *   updatedAt: string,
 * }}
 */
export function toMessageDTO(doc) {
  const m = typeof doc?.toObject === "function" ? doc.toObject() : doc;
  const dto = {
    _id: String(m._id),
    propertyId: String(m.property?._id ?? m.property),
    senderId: String(m.sender?._id ?? m.sender),
    recipientId: String(m.recipient?._id ?? m.recipient),
    name: m.name,
    email: m.email,
    body: m.body,
    read: Boolean(m.read),
    createdAt:
      m.createdAt instanceof Date
        ? m.createdAt.toISOString()
        : String(m.createdAt),
    updatedAt:
      m.updatedAt instanceof Date
        ? m.updatedAt.toISOString()
        : String(m.updatedAt),
  };
  if (m.phone) dto.phone = m.phone;
  return dto;
}

/**
 * Group inbox messages into ConversationDTOs keyed by propertyId:peerId.
 * Expects messages sorted newest-first.
 *
 * @param {object[]} messages — lean Message docs
 * @param {string} meId
 * @param {Map<string, object>} propertyById
 * @param {Map<string, object>} userById — {_id, username, image?}
 * @returns {object[]}
 */
export function buildConversationDTOs(
  messages,
  meId,
  propertyById,
  userById,
) {
  const me = String(meId);
  /** @type {Map<string, { propertyId: string, peerId: string, lastMessage: object, unread: number }>} */
  const threads = new Map();

  for (const m of messages) {
    const propertyId = String(m.property?._id ?? m.property);
    const senderId = String(m.sender?._id ?? m.sender);
    const recipientId = String(m.recipient?._id ?? m.recipient);
    const peerId = senderId === me ? recipientId : senderId;
    const id = `${propertyId}:${peerId}`;

    let thread = threads.get(id);
    if (!thread) {
      thread = {
        propertyId,
        peerId,
        lastMessage: m,
        unread: 0,
      };
      threads.set(id, thread);
    }

    if (recipientId === me && !m.read) {
      thread.unread += 1;
    }
  }

  const meUser = userById.get(me) || { _id: me, username: "" };
  const conversations = [];

  for (const [id, thread] of threads) {
    const property = propertyById.get(thread.propertyId);
    const peer = userById.get(thread.peerId) || {
      _id: thread.peerId,
      username: "",
    };
    const last = toMessageDTO(thread.lastMessage);

    const propertyDto = {
      _id: thread.propertyId,
      name: property?.name || "",
      slug: property?.slug || null,
    };
    if (property?.images) propertyDto.images = property.images;

    const meDto = { _id: me, username: meUser.username || "" };
    if (meUser.image) meDto.image = meUser.image;

    const peerDto = { _id: thread.peerId, username: peer.username || "" };
    if (peer.image) peerDto.image = peer.image;

    conversations.push({
      id,
      property: propertyDto,
      participants: { me: meDto, peer: peerDto },
      lastMessage: {
        _id: last._id,
        body: last.body,
        createdAt: last.createdAt,
        senderId: last.senderId,
        read: last.read,
      },
      unread: thread.unread,
    });
  }

  return conversations;
}
