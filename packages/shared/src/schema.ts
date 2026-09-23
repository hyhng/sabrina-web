import { z } from 'zod';

import { CATEGORIES } from './categories';

/**
 * Canonical content schema (docs/SPEC.md 10). The Payload collections must
 * match it, and every build validates against it — broken data fails the
 * build instead of shipping a broken site (docs/TECH.md 4.4).
 */

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'expected a #rrggbb colour, e.g. #A19C91');

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a lowercase, dash-separated slug');

export const photoSchema = z
  .object({
    /** Also the key prefix in R2: photos/{id}/{width}.webp */
    id: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    /** Required — the grid lays out from data, never from the DOM (CLAUDE.md, rule 3). */
    aspectRatio: z.number().positive(),
    /** Generated variants, e.g. [400, 800, 1200]; never upscaled past the original. */
    widths: z.array(z.number().int().positive()).min(1),
    /** Placeholder colour shown while the photo loads. */
    dominantColor: hexColor,
    alt: z.string().optional(),
    originalFilename: z.string().min(1),
    bytesOriginal: z.number().int().nonnegative(),
    bytesWebp: z.number().int().nonnegative(),
  })
  .refine((photo) => Math.abs(photo.aspectRatio - photo.width / photo.height) <= 0.01, {
    // [proposal] Not spelled out in SPEC. An aspectRatio that disagrees with the
    // pixel dimensions silently breaks the grid, which is exactly the class of
    // broken data TECH 4.4 wants the build to reject.
    message: 'aspectRatio does not match width / height',
    path: ['aspectRatio'],
  });

export const creditSchema = z.object({
  role: z.string().min(1),
  name: z.string().min(1),
});

export const projectSchema = z
  .object({
    title: z.string().min(1),
    /** Generated from the title, locked after first publish (docs/SPEC.md 8.3). */
    slug,
    category: z.enum(CATEGORIES),
    year: z.number().int().optional(),
    client: z.string().optional(),
    clientLine2: z.string().optional(),
    credits: z.array(creditSchema).default([]),
    photos: z.array(photoSchema).min(1),
    cover: photoSchema,
    status: z.enum(['draft', 'published']),
  })
  .refine((project) => project.photos.some((photo) => photo.id === project.cover.id), {
    message: 'cover must be one of photos',
    path: ['cover'],
  });

/** Tile order on the homepage. The client sets the order, not the position. */
export const homepageSchema = z.object({
  projects: z.array(projectSchema),
});

export const settingsSchema = z.object({
  portrait: photoSchema.optional(),
  /** Plain text, paragraphs split by a blank line — no rich text (docs/SPEC.md 8.6). */
  bio: z.string(),
  location: z.string(),
  email: z.email(),
  instagramHandle: z.string().min(1),
  instagramUrl: z.url(),
  seoDescription: z.string(),
  /** [proposal] Optional — still an open question (docs/PHASES.md, question 9). */
  ogImage: photoSchema.optional(),
});

/** [proposal] What getContent() returns, so one parse covers a whole build. */
export const contentSchema = z.object({
  homepage: homepageSchema,
  settings: settingsSchema,
});

export type Photo = z.infer<typeof photoSchema>;
export type Credit = z.infer<typeof creditSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Homepage = z.infer<typeof homepageSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type Content = z.infer<typeof contentSchema>;
