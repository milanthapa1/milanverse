import {
  BookOpen,
  Brain,
  Briefcase,
  Camera,
  Clapperboard,
  Cloud,
  Code2,
  Coffee,
  Dumbbell,
  Folder,
  Gamepad2,
  GraduationCap,
  Headphones,
  Heart,
  LayoutGrid,
  Music,
  Newspaper,
  Palette,
  Plane,
  Rocket,
  ShoppingBag,
  Sparkles,
  Trophy,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/**
 * Registry mapping category icon keys (stored in the DB as strings) to
 * lucide-react components. Never import lucide components into Prisma seed
 * or API code — always go through these keys.
 */
const ICONS: Record<string, LucideIcon> = {
  clapperboard: Clapperboard,
  trophy: Trophy,
  sparkles: Sparkles,
  "code-2": Code2,
  code: Code2,
  "graduation-cap": GraduationCap,
  "gamepad-2": Gamepad2,
  gamepad: Gamepad2,
  headphones: Headphones,
  "layout-grid": LayoutGrid,
  "book-open": BookOpen,
  briefcase: Briefcase,
  palette: Palette,
  camera: Camera,
  music: Music,
  newspaper: Newspaper,
  "shopping-bag": ShoppingBag,
  coffee: Coffee,
  utensils: Utensils,
  plane: Plane,
  dumbbell: Dumbbell,
  brain: Brain,
  heart: Heart,
  folder: Folder,
  cloud: Cloud,
  rocket: Rocket,
};

/**
 * Unique keys offered in the category editor (aliases like `code` are kept
 * for backwards compatibility but not shown twice).
 */
export const CATEGORY_ICON_OPTIONS = [
  "layout-grid",
  "sparkles",
  "clapperboard",
  "trophy",
  "code-2",
  "graduation-cap",
  "gamepad-2",
  "headphones",
  "book-open",
  "briefcase",
  "palette",
  "camera",
  "music",
  "newspaper",
  "shopping-bag",
  "coffee",
  "utensils",
  "plane",
  "dumbbell",
  "brain",
  "heart",
  "folder",
  "cloud",
  "rocket",
] as const;

interface CategoryIconProps {
  icon: string;
  className?: string;
  "aria-hidden"?: boolean;
}

export function CategoryIcon({ icon, className, ...rest }: CategoryIconProps) {
  const Icon = ICONS[icon] ?? LayoutGrid;
  return <Icon className={className} aria-hidden={rest["aria-hidden"] ?? true} />;
}

export function categoryIconKeys(): string[] {
  return [...CATEGORY_ICON_OPTIONS];
}
