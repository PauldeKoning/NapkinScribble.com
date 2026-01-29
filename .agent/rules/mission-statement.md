---
trigger: manual
description: When making a web ui element design decision
---

Project Manifest: NapkinScribble.com
1. The Mission
NapkinScribble is a low-friction "idea dump" for founders and creators. 
It captures the raw, unpolished energy of a "cocktail napkin" sketch before the inner critic takes over. 
The goal is Speed to Save: no complex categories, no mandatory fields—just a place for the brain to breathe.

2. Global UI Strategy (Material 3 + Napkin Aesthetic) -- Feel free to change any of this on the fly
The design should feel like a high-tech stationery kit.
Design System: Google Material 3 (M3). 
Use large border-radii ($24px$ to $28px$), elevated surface tones, and clear "Floating Action Buttons" (FAB).
Color Palette:
Surface: #FCFBF4 (Paper White / Off-white).
Primary: #003366 (Classic "Bic Pen" Blue).
Secondary: #E8DEF8 (M3 Soft Lavender for highlights).
Accent: #6F4E37 (Coffee Stain Brown) used sparingly for subtle borders.

Typography: Clean Sans-Serif (e.g., Inter or Roboto) for UI elements; a subtle "Handwritten" font for Idea Headers to maintain the napkin vibe.

Layout: Responsive Masonry Grid (Google Keep style). 
Cards should have varied heights based on content length.

3. Tech StackStrict adherence to a "Thin-Client / High-Speed" architecture:
Build Tool: Vite (for near-instant HMR).
Framework: React with TypeScript (strictly typed Idea interfaces).
Backend-as-a-Service: Firebase (Auth & Firestore).
Styling: Tailwind CSS (utility-first, no custom CSS files).
Auth Flow: Google and Apple Social Sign-in only.

4. MVP Feature SetInstant Auth: 
Redirect to Google/Apple login if unauthenticated.
The Scribble Feed: A real-time stream of the user’s ideas, sorted by createdAt.
The "Big Scribble" FAB: A prominent bottom-right button that opens a minimalist, auto-expanding text modal.