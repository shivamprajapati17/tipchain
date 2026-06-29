import "@testing-library/jest-dom/vitest";
import React from "react";

// ─── framer-motion mock ─────────────────────────────────────────────────────

// Use React.createElement to avoid JSX parsing issues
const createMotionTag = (tag: string) => {
  const MotionComponent = ({ children, ...props }: any) => {
    const {
      initial,
      animate,
      exit,
      transition,
      variants,
      layout,
      layoutId,
      whileHover,
      whileTap,
      whileInView,
      onAnimationComplete,
      key: _key,
      ...cleanProps
    } = props;
    return React.createElement(tag, cleanProps, children);
  };
  MotionComponent.displayName = `motion.${tag}`;
  return MotionComponent;
};

const motionTags = [
  "div", "span", "button", "p", "h1", "h2", "h3",
  "section", "article", "main", "header", "footer", "nav",
  "li", "ul", "ol", "a", "img", "figure", "figcaption",
];

const motion: Record<string, any> = {};
for (const tag of motionTags) {
  motion[tag] = createMotionTag(tag);
}

vi.mock("framer-motion", () => ({
  motion,
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  useMotionValue: (initial: number) => ({ get: () => initial, set: vi.fn() }),
  useSpring: (value: any) => ({ get: () => 0, set: vi.fn() }),
  useTransform: (value: any, _: any, __: any) => ({ get: () => 0 }),
}));

// ─── recharts mock ──────────────────────────────────────────────────────────

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) =>
    React.createElement("div", { "data-testid": "responsive-container" }, children),
  AreaChart: ({ children }: any) =>
    React.createElement("div", { "data-testid": "area-chart" }, children),
  BarChart: ({ children }: any) =>
    React.createElement("div", { "data-testid": "bar-chart" }, children),
  Area: () => null,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
  Legend: () => null,
}));

// ─── lucide-react mock ──────────────────────────────────────────────────────

vi.mock("lucide-react", async () => {
  const actual: Record<string, any> = await vi.importActual("lucide-react");
  const mockIcons: Record<string, any> = {};
  for (const name of Object.keys(actual)) {
    if (name[0] === name[0].toUpperCase() && typeof actual[name] === "function") {
      mockIcons[name] = ({ className, size, ...props }: any) =>
        React.createElement("svg", {
          "data-testid": `icon-${name}`,
          className,
          width: size || 16,
          height: size || 16,
          ...props,
        });
    }
  }
  return { ...actual, ...mockIcons };
});
