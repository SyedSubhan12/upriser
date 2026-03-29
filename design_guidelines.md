# ExamsValley Educational Platform - Design Guidelines

## Design Approach
This is a utility-focused educational platform requiring a clean, professional design system that prioritizes usability, learnability, and consistency across student, teacher, and admin interfaces. The design follows a modern, school-friendly aesthetic with clear information hierarchy.

## Core Design Elements

### A. Typography
- **Font Family**: Clean sans-serif system font stack for optimal readability
- **Hierarchy**:
  - Page titles: text-2xl weight
  - Section headings: text-xl weight  
  - Body text: text-base
  - Helper text: text-sm
- **Emphasis**: High contrast near-black text on light backgrounds for accessibility

### B. Layout System
- **Spacing**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm (p-4, m-8, gap-6, etc.)
- **Container Widths**: 
  - Dashboard content: max-w-7xl
  - Forms and detail pages: max-w-4xl
  - Reading content: max-w-prose

### C. Component Library

**Navigation & Layout**:
- Top navbar with role-appropriate navigation items
- Collapsible sidebar for desktop (converts to top menu on mobile/tablet)
- Breadcrumbs for deep navigation paths
- App shell with consistent header height and sidebar width

**Data Display**:
- Cards: Rounded corners, subtle shadow, generous padding, white background on light gray app background
- Tables: Sticky headers, zebra-striped rows, responsive horizontal scroll, hover states on rows
- Stat cards: Large numbers, descriptive labels, icon accompaniment
- Resource cards: Thumbnail area, title, metadata badges, action buttons

**Forms & Inputs**:
- Full-width inputs with labels positioned above
- Helper text below inputs in muted color
- Error states with red accent and descriptive messages
- Select dropdowns with clear option hierarchy
- File upload areas with drag-and-drop visual affordance
- Checkboxes and radio buttons with clear active states

**Interactive Elements**:
- Primary buttons: Solid fill, high contrast
- Secondary buttons: Outlined style
- Ghost buttons: Transparent with hover background
- Icon buttons for compact actions
- Tabs for content organization with clear active indicators
- Modals: Centered overlay with backdrop, close button, clear actions

**Feedback & Status**:
- Badge pills for resource types (Past Paper, Notes, Video, etc.)
- Status pills for assignment states (Pending, Submitted, Graded)
- Toast notifications for system feedback
- Empty states with helpful illustrations and CTAs
- Loading spinners for async operations
- Tooltips for additional context on hover

**Specialized Components**:
- Study tree sidebar: Expandable/collapsible hierarchy (Board → Subject → Topic)
- Quiz question cards: Clear question text, radio-style option selection, visual feedback for selection
- Quiz timer: Prominent countdown display with warning state approaching deadline
- Material list: Grid or list view toggle, filtering controls
- Assignment submission area: File upload with progress indicator
- Content review table: Approve/reject actions, preview capabilities

### D. Role-Based Layouts

**Student Layout**:
- Dashboard with activity overview and quick stats
- Two-column layout for study materials (tree navigation + content grid)
- Quiz interface with progress tracking and timer prominence
- Assignment submission workflow with clear status indicators
- Profile management with avatar and preferences

**Teacher Layout**:
- Dashboard with uploaded content metrics and recent activity
- Material creation forms with rich metadata inputs
- Quiz builder with question list editor and reordering
- Assignment management table with submission tracking
- Analytics views with simple data visualizations

**Admin Layout**:
- System overview dashboard with user and content metrics
- Board/subject/topic tree management interface
- User management table with role assignment controls
- Content moderation queue with approval workflow
- Settings panels organized by category

### E. Responsive Behavior
- **Desktop (≥1024px)**: Full sidebar navigation, multi-column dashboards, expanded tables
- **Tablet (768px-1023px)**: Collapsed sidebar to hamburger menu, two-column grids reduce to single
- **Mobile (<768px)**: Bottom navigation or top menu bar, single-column layouts, full-width cards, stacked forms

### F. Images
This educational platform does not require hero images. Focus on:
- User avatars (circular, consistent sizing)
- Resource thumbnails for materials (videos, documents)
- Empty state illustrations (simple, friendly)
- Board/school logos in admin section
- Icon library for consistent visual language (use Heroicons via CDN)

### G. Interaction Patterns
- Hover states on all interactive elements (buttons, cards, table rows)
- Active/selected states clearly distinguished with color and weight
- Smooth transitions for expandable sections and modals (200-300ms)
- Confirmation dialogs for destructive actions (delete, reject content)
- Inline validation for forms with immediate feedback
- Pagination for long lists with page size options

### H. Information Hierarchy
- Page headers with title, optional description, and primary actions aligned right
- Filter bars positioned above content with clear/apply actions
- Metric grids with 2-4 columns displaying key statistics prominently
- Content sections separated by spacing, not heavy dividers
- Sidebar navigation with current page highlighted and parent sections expanded

## Platform-Specific Considerations
- **School-Friendly**: Professional but approachable, avoid overly playful or distracting elements
- **Content-First**: Prioritize readability and information density over decorative elements
- **Multi-Role Clarity**: Distinct color accents or header treatments to indicate current role context
- **Performance**: Minimize animations, prioritize fast page loads and responsive interactions
- **Accessibility**: WCAG AA compliance for color contrast, keyboard navigation support, screen reader compatibility