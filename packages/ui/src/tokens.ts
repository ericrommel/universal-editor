// Web stack only. Module 0 does not bundle a font.
const fontFamilyUi =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif';

export const tokens = {
  color: {
    light: {
      canvas: "#F4F5F7",
      surface: "#FFFFFF",
      text: {
        primary: "#1C1F26",
        secondary: "#3A4150",
      },
      border: "#7A8496",
      focus: "#1D4ED8",
      status: {
        ready: "#146C43",
        failed: "#B42318",
      },
    },
    dark: {
      canvas: "#14161C",
      surface: "#1E2128",
      text: {
        primary: "#F4F5F7",
        secondary: "#C5CAD3",
      },
      border: "#9AA3B5",
      focus: "#93C5FD",
      status: {
        ready: "#9BD4B0",
        failed: "#F0B4AE",
      },
    },
  },
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "24px",
    6: "32px",
    7: "48px",
    8: "64px",
  },
  type: {
    display: { size: "1.75rem", weight: 600, lineHeight: 1.25 },
    status: { size: "1.375rem", weight: 600, lineHeight: 1.3 },
    body: { size: "1.0625rem", weight: 400, lineHeight: 1.5 },
    label: { size: "0.875rem", weight: 600, lineHeight: 1.4 },
  },
  radius: {
    surface: "12px",
    control: "8px",
  },
  focus: {
    ring: {
      width: "2px",
      offset: "2px",
    },
  },
  motion: {
    duration: {
      // Zero milliseconds. Disclosure does not animate, and there is no other duration.
      instant: 0,
    },
  },
  font: {
    family: {
      ui: fontFamilyUi,
    },
  },
} as const;
