# Design System Overhaul Request Template

Please use this template to provide detailed design specifications for new features or a complete design system overhaul. The more detail you provide, the smoother the integration process will be.

---

## 1. Design Handoff & Overview

*   **Design Files Link(s):**
    *   [e.g., Figma, Sketch, Adobe XD link(s) to the design board/prototype]
    *   *Please ensure all relevant screens, states (hover, active, disabled, focus, error), and responsive layouts are included.*
*   **High-Level Design Vision/Goals:**
    *   [Brief description of the overall aesthetic, brand guidelines, and primary objectives of this design update.]
*   **Target User Flows Affected:**
    *   [List key user journeys or application areas that will be impacted by this design.]

---

## 2. Design Tokens & Theming

### 2.1 Color Palette
*   **Primary Colors:**
    *   [Hex codes, HSL values, or names for primary brand colors.]
*   **Secondary Colors:**
    *   [Hex codes, HSL values, or names for secondary brand colors.]
*   **Accent Colors:**
    *   [Hex codes, HSL values, or names for interactive elements, highlights.]
*   **Neutral Colors (Grayscale):**
    *   [Hex codes, HSL values, or names for text, backgrounds, borders, etc.]
*   **Semantic Colors:**
    *   `--success` (e.g., green for positive feedback): [Hex/HSL]
    *   `--warning` (e.g., yellow/orange for alerts): [Hex/HSL]
    *   `--error` (e.g., red for errors): [Hex/HSL]
    *   `--info` (e.g., blue for informational messages): [Hex/HSL]
*   **Text Colors:**
    *   `--text-primary`: [Hex/HSL]
    *   `--text-secondary`: [Hex/HSL]
    *   `--text-disabled`: [Hex/HSL]
*   **Background Colors:**
    *   `--background-default`: [Hex/HSL]
    *   `--background-elevated`: [Hex/HSL]
    *   `--background-surface`: [Hex/HSL]
*   *Please specify if any colors should correspond to existing CSS variables in `src/styles/theme.css` or require new ones.*

### 2.2 Typography
*   **Font Family:**
    *   [e.g., 'Inter', sans-serif]
*   **Headings (H1-H6):**
    *   H1: [Font size, line height, font weight, letter spacing]
    *   H2: [Font size, line height, font weight, letter spacing]
    *   ...
*   **Body Text:**
    *   Paragraph (P): [Font size, line height, font weight, letter spacing]
    *   Small Text: [Font size, line height, font weight, letter spacing]
*   **Link Text:**
    *   [Font size, line height, font weight, color, underline behavior]

### 2.3 Spacing
*   **Base Spacing Unit:** [e.g., 4px, 8px]
*   **Specific Spacing Tokens:**
    *   `--space-xs`: [Value]
    *   `--space-sm`: [Value]
    *   `--space-md`: [Value]
    *   `--space-lg`: [Value]
    *   `--space-xl`: [Value]
    *   *(Correlate with Tailwind's spacing scale if possible)*

### 2.4 Border Radius
*   `--radius-none`: [Value]
*   `--radius-sm`: [Value]
*   `--radius-md`: [Value]
*   `--radius-lg`: [Value]
*   `--radius-full`: [Value]
*   *(Correlate with Tailwind's border-radius scale if possible)*

### 2.5 Shadows / Elevations
*   `--shadow-sm`: [CSS value e.g., `0 1px 2px rgba(0,0,0,0.1)`]
*   `--shadow-md`: [CSS value]
*   `--shadow-lg`: [CSS value]

### 2.6 Theming Specifics
*   **New Themes:**
    *   [If applicable, list any new `data-theme` variants (e.g., `dark`, `compact`, `accessibility`) and their specific token overrides.]
*   **Theme Switcher Requirements:**
    *   [How should users switch themes? (e.g., dropdown, toggle button)]

---

## 3. Component Specifications

*For each new or significantly modified component, please provide the following:*

### Component Name: [e.g., PrimaryButton, UserAvatar, ModalDialog]

*   **Design Link (Specific):**
    *   [Direct link to the component in the design file, if available.]
*   **Purpose/Functionality:**
    *   [Brief description of what the component does and its role.]
*   **Visual Variants:**
    *   **States:** (e.g., default, hover, active, focus, disabled, loading, error)
        *   [Describe/show visual differences for each state.]
    *   **Sizes:** (e.g., small, medium, large)
        *   [Describe/show visual differences for each size.]
    *   **Types/Styles:** (e.g., primary, secondary, outline, ghost)
        *   [Describe/show visual differences for each type/style.]
*   **Props/API (Proposed):**
    *   `variant`: `string` (e.g., "primary" | "secondary" | "ghost")
    *   `size`: `string` (e.g., "sm" | "md" | "lg")
    *   `onClick`: `() => void`
    *   `disabled`: `boolean`
    *   `children`: `ReactNode`
    *   `icon`: `ReactNode` (if applicable)
    *   `fullWidth`: `boolean`
    *   ...
*   **Styling Notes:**
    *   [Any specific Tailwind classes, custom CSS, or responsive behaviors to note.]
    *   *Remember, primary styling should use Tailwind utility classes and CSS variables defined in `theme.css`.*
*   **Accessibility (A11y) Considerations:**
    *   [e.g., required ARIA attributes, keyboard navigation, contrast ratios.]
*   **Interactions/Animations:**
    *   [Describe any specific hover effects, transitions, or animations.]

---

## 4. Specific Page/Layout Updates

*For any pages or layouts that undergo significant changes, please detail them here:*

### Page/Layout Name: [e.g., Dashboard Layout, Product Detail Page]

*   **Design Link (Specific):**
    *   [Direct link to the page/layout in the design file.]
*   **Structure/Grid Changes:**
    *   [Describe how the layout structure changes, e.g., number of columns, responsive behavior.]
*   **New/Modified Sections:**
    *   [Detail any new sections or significant changes to existing sections on the page.]
*   **Responsiveness:**
    *   [Specific behaviors for different breakpoints (mobile, tablet, desktop).]

---

## 5. Testing & Quality Assurance Notes

*   **Key User Flows to Prioritize for E2E Testing:**
    *   [e.g., "User login process with new button styles," "Form submission with new input fields."]
*   **Visual Regression Areas:**
    *   [Specific components or pages where visual changes are critical and need close monitoring.]
*   **Accessibility Focus Areas:**
    *   [Any particular components or interactions that need extra accessibility scrutiny.]

---

## 6. Additional Notes / Open Questions

*   [Any other relevant information, questions for the development team, or potential challenges.]

---
