# Curriculum Learning App

## Navigation Architecture & UX Wiring

---

## 1. Purpose of This Document

This document defines the **complete navigation system, information architecture, and subject‑level wiring** for a curriculum‑based education app inspired by Papa Cambridge.

It is written in a **machine‑executable prompt format** so an **autonomous UI/UX AI agent ("anti‑gravity agent")** can design and implement the app **without human clarification**.

The design goal is:

- Maximum clarity
- Minimal cognitive load
- 2‑tap access to subjects
- Scalable to new boards and content

Authentication (student/teacher login) is intentionally excluded.

---

## 2. Global Navigation Model

### Navigation Type

- **Persistent  Navigation Bar**
- Visible on all screens

### Navigation Items

1. Home
2. Curriculum
3. Subjects
4. Help

No authentication or profile icons.

---

## 3. Home Screen

### Purpose

- Orientation
- Entry point into curricula

### UI Elements

- App title / logo
- Short descriptive paragraph
- Curriculum tiles

### Curriculum Tiles

- CAIE (Cambridge Assessment International Education)
- Edexcel (National Curriculum for England)
- IB (International Baccalaureate)

### Behavior

- Tapping a tile navigates directly to that curriculum’s level/program selector

---

## 4. Curriculum Screen

### Purpose

- Primary navigation hub

### Structure

- Vertical list of curricula

### Items

- CAIE – Cambridge Assessment International Education
- Edexcel – National Curriculum for England
- IB – International Baccalaureate

### Behavior

- Selecting a curriculum opens its internal structure (levels or programs)

---

## 5. Curriculum Wiring Details

### 5.1 CAIE (Cambridge Assessment International Education)

#### Levels

- IGCSE
- O Level
- A Level

#### Navigation Flow

Curriculum → Level → Subject → Subject Dashboard

#### Subject Examples

- Mathematics
- Physics
- Chemistry
- Biology
- Computer Science
- English
- Economics
- Business Studies

---

### 5.2 Edexcel (National Curriculum for England)

#### Levels

- IGCSE
- GCSE
- A Level

#### Navigation Flow

Curriculum → Level → Subject → Subject Dashboard

#### Subject Examples

- Mathematics
- Physics
- Chemistry
- Biology
- Computer Science
- English Language
- English Literature
- Economics

---

### 5.3 IB (International Baccalaureate)

#### Programs

- MYP (Middle Years Programme)
- DP (Diploma Programme)

#### Navigation Flow

Curriculum → Program → Subject Group → Subject → Subject Dashboard

#### Subject Groups (DP)

- Studies in Language and Literature
- Language Acquisition
- Individuals and Societies
- Sciences
- Mathematics
- The Arts

---

## 6. Subjects Screen

### Purpose

- Fast access for advanced users

### Features

- Global subject search
- Filters:
  - Curriculum
  - Level / Program

### Display

- Alphabetical subject list
- Each item shows curriculum + level

### Behavior

- Selecting a subject opens Subject Dashboard directly

---

## 7. Subject Dashboard (Universal Template)

This structure is identical across all curricula and subjects.

### Sections

1. Subject Overview
2. Syllabus Outline
3. Notes
4. Video Lessons
5. Practice Questions
6. Past Papers
7. Mark Schemes
8. Grade Boundaries (if applicable)

### UX Rules

- Sections are collapsible
- Content loads lazily
- Consistent layout across subjects

---

## 8. Help Screen

### Purpose

- User assistance

### Sections

- How to use the app
- Curriculum explanations
- FAQs
- Contact / Feedback

---

## 9. Visual Design Rules

### Style

- Clean
- Minimal
- Neutral colors
- High contrast text

### Layout

- Center‑aligned titles
- Generous white space
- No decorative clutter

### Icons

- Simple line icons
- No gradients or shadows in navigation

---

## 10. Anti‑Gravity AI Agent Execution Prompt

### System Instruction

You are an autonomous UI/UX designer and frontend architect.

Your task is to generate:

- Full navigation UI
- Screen layouts
- Component hierarchy
- Wireframes or production UI

You must strictly follow the navigation and content architecture defined in this document.

### Constraints

- Do NOT add authentication
- Do NOT add extra navigation items
- Do NOT invent curricula or levels
- Maintain consistent patterns across all flows

### Output Requirements

- Screens must be logically connected
- All user paths must be reachable in ≤ 2 taps from Home
- Subject dashboard must be reusable as a single component

---

## 11. Completion Criteria

The implementation is considered complete when:

- All curricula are accessible
- All levels/programs are navigable
- All subjects route to a subject dashboard
- Bottom navigation persists correctly
- UX is consistent across the app

---

End of specification.

