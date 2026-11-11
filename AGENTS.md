# Agent Development Rules & Skills Directive

Whenever writing, reviewing, refactoring, or designing frontend and full-stack code in this repository, ALWAYS consult and adhere to the installed **Vercel Agent Skills** located in `.agents/skills/`:

## 1. React & Next.js Performance (`vercel-react-best-practices`)
- **Eliminate Waterfalls (CRITICAL)**:
  - Check cheap synchronous conditions before awaiting remote calls.
  - Defer `await` into specific branches where data is actually consumed.
  - Execute independent asynchronous operations in parallel using `Promise.all()`.
  - In Next.js route handlers and server components, start promises early and await late.
  - Implement `<Suspense>` boundaries to stream UI rather than blocking initial render.
- **Bundle Size Optimization (CRITICAL)**:
  - Import specific modules directly; avoid root barrel file imports.
  - Use `next/dynamic` for heavy client components and third-party widgets.
  - Defer non-critical third-party analytics/scripts until after hydration.
- **Server-Side Optimization (HIGH)**:
  - Deduplicate per-request calls using `React.cache()`.
  - Cache reusable cross-request computations and lookups with LRU caches.
- **Re-render & Rendering Efficiency (MEDIUM)**:
  - Keep state localized to the components that need it.
  - Avoid layout thrashing and unnecessary recreation of expensive objects.

## 2. Web Interface & Design Guidelines (`web-design-guidelines`)
- **Accessibility (a11y)**:
  - Ensure all interactive elements have semantic HTML, accessible names (`aria-label`), and full keyboard support (`Tab`, `Enter`, `Space`).
  - Maintain visible, high-contrast focus rings (`focus-visible`).
- **Responsive & Motion**:
  - Respect `prefers-reduced-motion` for animations.
  - Use compositor-friendly CSS transforms (`translate`, `scale`, `opacity`) instead of layout properties (`top`, `height`).
- **Forms & Inputs**:
  - Always provide meaningful input validation, labels, `autocomplete` attributes, and clear error states.

## 3. Component Architecture (`composition-patterns`)
- **Composition Over Props**:
  - Avoid boolean prop proliferation (flags like `isHeader`, `showFooter`, `withSidebar`).
  - Use compound components, slot patterns, and children composition for flexible, reusable UI elements.
- **React 19 Compatibility**:
  - Leverage modern React 19 hooks and patterns where applicable.
