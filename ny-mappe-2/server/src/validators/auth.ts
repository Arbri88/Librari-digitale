import Joi from "joi";

export const registerSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().max(100).required(),
  }).required(),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

export const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).required(),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

export const changePasswordSchema = Joi.object({
  body: Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().min(8).required(),
  }).required(),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

export const refreshSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }).required(),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});
