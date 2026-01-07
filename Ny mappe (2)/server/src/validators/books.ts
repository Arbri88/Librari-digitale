import Joi from "joi";

export const listBooksSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(12),
    category: Joi.string().uuid().optional(),
    author: Joi.string().max(255).optional(),
    year: Joi.number().integer().min(0).max(3000).optional(),
    available: Joi.boolean().optional(),
    sort: Joi.string().valid("title","author","published_year","created_at").default("created_at"),
    order: Joi.string().valid("asc","desc").default("desc"),
  }).unknown(true),
  params: Joi.object().unknown(true),
});

export const createBookSchema = Joi.object({
  body: Joi.object({
    category_id: Joi.string().uuid().allow(null),
    title: Joi.string().max(255).required(),
    author: Joi.string().max(255).required(),
    isbn: Joi.string().max(20).allow(null, ""),
    description: Joi.string().allow(null, ""),
    cover_image_url: Joi.string().uri().max(500).allow(null, ""),
    total_copies: Joi.number().integer().min(1).required(),
    available_copies: Joi.number().integer().min(0).required(),
    published_year: Joi.number().integer().min(0).max(3000).allow(null),
    pages: Joi.number().integer().min(1).allow(null),
    language: Joi.string().max(50).allow(null, ""),
  }).required(),
  query: Joi.object().unknown(true),
  params: Joi.object().unknown(true),
});

export const updateBookSchema = Joi.object({
  body: Joi.object({
    category_id: Joi.string().uuid().allow(null),
    title: Joi.string().max(255),
    author: Joi.string().max(255),
    isbn: Joi.string().max(20).allow(null, ""),
    description: Joi.string().allow(null, ""),
    cover_image_url: Joi.string().uri().max(500).allow(null, ""),
    total_copies: Joi.number().integer().min(1),
    available_copies: Joi.number().integer().min(0),
    published_year: Joi.number().integer().min(0).max(3000).allow(null),
    pages: Joi.number().integer().min(1).allow(null),
    language: Joi.string().max(50).allow(null, ""),
    is_deleted: Joi.boolean(),
  }).min(1).required(),
  query: Joi.object().unknown(true),
  params: Joi.object({ id: Joi.string().uuid().required() }).required(),
});

export const idParamSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object().unknown(true),
  params: Joi.object({ id: Joi.string().uuid().required() }).required(),
});

export const searchSchema = Joi.object({
  body: Joi.object().unknown(true),
  query: Joi.object({
    q: Joi.string().min(1).max(200).required(),
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(12),
  }).required(),
  params: Joi.object().unknown(true),
});
