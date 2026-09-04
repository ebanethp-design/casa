# The Casa — PRD

## Original problem
Build a French real estate website for Gabon. Public users can browse rental/sale listings, filter by city/neighborhood, like a property (no account), open a detail page and submit an interest form (name, contact, phone, email — all required). After submitting, redirect to home. Admin (default password) can view/edit/delete/hide listings, view/add/delete interest submissions, and change site name + accent color.

## Personas
- Visitor: browses and contacts without signing up.
- Admin: single admin user, seeded on startup, manages content and appearance.

## Architecture
- Backend: FastAPI + MongoDB + Motor. JWT (HS256) bearer auth. All routes `/api/...`.
- Frontend: React + Tailwind + shadcn/ui + sonner + framer-motion. Fonts: Playfair Display (headings), Manrope (body). CSS variables drive live theme.

## Implemented (2026-02)
- 50 fake listings seeded from Unsplash images across Libreville, Port-Gentil, Franceville, Oyem, Lambaréné
- Filters: text search, city, neighborhood, transaction type, property type
- Property card with like (localStorage) + hover motion
- Detail page: bento gallery, features, sticky CTA, interest form dialog
- Interest submission with FR toast + redirect to home
- `/favoris` page for saved properties
- Admin login (`/admin`) with seeded credentials
- Admin dashboard `/admin/dashboard` — properties CRUD + hide toggle, interests CRUD, live theme (site name, tagline, accent color)

## Credentials
- Admin email: `admin@thecasa.ga`
- Admin password: `admin123`
(also in `/app/memory/test_credentials.md`)

## Backlog / next
- P1: Real image upload from admin (currently image URLs only)
- P1: Price range + bedrooms slider filters
- P2: Contact preferences per admin (email notifications on new interest)
- P2: Map view of listings per city
- P2: Multilingual (FR/EN) toggle
