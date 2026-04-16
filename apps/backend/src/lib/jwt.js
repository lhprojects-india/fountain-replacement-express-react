export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_ISSUER = process.env.JWT_ISSUER || 'lh-driver-onboarding-api';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'lh-driver-onboarding-clients';

export const jwtSignOptionsByRole = {
  admin: {
    expiresIn: '1d',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  },
  driver: {
    expiresIn: '24h',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  },
};

export const jwtVerifyOptions = {
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
};
