import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3009),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().default(7),
  FRONTEND_ORIGINS: Joi.string().required(),
  API_PUBLIC_URL: Joi.string().uri().default('http://localhost:3009'),
  OAUTH_SUCCESS_REDIRECT: Joi.string()
    .uri()
    .default('http://localhost:3000/dashboard'),
  PASSWORD_RESET_URL_BASE: Joi.string()
    .uri()
    .default('http://localhost:3000/reset-password'),
  AUTH_GOOGLE_ENABLED: Joi.string().valid('true', 'false').default('false'),
  AUTH_GITHUB_ENABLED: Joi.string().valid('true', 'false').default('false'),
  GOOGLE_CLIENT_ID: Joi.when('AUTH_GOOGLE_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  GOOGLE_CLIENT_SECRET: Joi.when('AUTH_GOOGLE_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  GITHUB_CLIENT_ID: Joi.when('AUTH_GITHUB_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  GITHUB_CLIENT_SECRET: Joi.when('AUTH_GITHUB_ENABLED', {
    is: 'true',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  MAIL_MODE: Joi.string().valid('console', 'resend').default('console'),
  RESEND_API_KEY: Joi.when('MAIL_MODE', {
    is: 'resend',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  RESEND_FROM: Joi.string().allow('').default('noreply@localhost'),
});
