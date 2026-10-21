import jwt, { SignOptions } from 'jsonwebtoken';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'eventeev-attendee-jwt-secret-key-2026';
}

export function signToken(payload: any, expiresIn: SignOptions['expiresIn'] = '7d') {
  const normalizedPayload = {
    ...payload,
    ...(payload && payload.id && !payload.attendee
      ? { attendee: { id: payload.id, email: payload.email, name: payload.name } }
      : {}),
  };
  return jwt.sign(normalizedPayload, getJwtSecret(), { expiresIn });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

