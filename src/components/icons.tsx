import type { SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Archive as LArchive,
  CalendarCheck as LCalendarCheck,
  CalendarDays as LCalendarDays,
  Check as LCheck,
  CircleCheck as LCircleCheck,
  CirclePause as LCirclePause,
  CircleX as LCircleX,
  Dumbbell as LDumbbell,
  Flame as LFlame,
  History as LHistory,
  MessageCircle as LMessageCircle,
  Moon as LMoon,
  NotebookPen as LNotebookPen,
  Pin as LPin,
  Play as LPlay,
  Target as LTarget,
  Trash2 as LTrash,
  TriangleAlert as LTriangleAlert,
  Trophy as LTrophy,
  User as LUser,
  Users as LUsers,
  X as LX,
} from "lucide-react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & { className?: string };

/** Minimal line icons sized to the surrounding text (1em) and coloured with it. */
function line(Lucide: LucideIcon) {
  return function Icon({ className = "", ...rest }: IconProps) {
    return (
      <Lucide
        aria-hidden
        strokeWidth={1.75}
        className={`inline-block h-[1em] w-[1em] shrink-0 align-[-0.125em] ${className}`}
        {...rest}
      />
    );
  };
}

export const ArchiveIcon = line(LArchive);
export const CalendarCheckIcon = line(LCalendarCheck);
export const CalendarIcon = line(LCalendarDays);
export const CheckIcon = line(LCheck);
export const DoneIcon = line(LCircleCheck);
export const PauseIcon = line(LCirclePause);
export const MissingIcon = line(LCircleX);
export const DumbbellIcon = line(LDumbbell);
export const FlameIcon = line(LFlame);
export const HistoryIcon = line(LHistory);
export const CommentIcon = line(LMessageCircle);
export const RestIcon = line(LMoon);
export const NotesIcon = line(LNotebookPen);
export const PinIcon = line(LPin);
export const PlayIcon = line(LPlay);
export const TargetIcon = line(LTarget);
export const TrashIcon = line(LTrash);
export const AlertIcon = line(LTriangleAlert);
export const TrophyIcon = line(LTrophy);
export const UserIcon = line(LUser);
export const GroupIcon = line(LUsers);
export const CrossIcon = line(LX);

/** Icons by name, for props that cross the server → client boundary. */
export const ICONS = {
  calendar: CalendarIcon,
  trophy: TrophyIcon,
  notes: NotesIcon,
  target: TargetIcon,
  dumbbell: DumbbellIcon,
  user: UserIcon,
} as const;
export type IconName = keyof typeof ICONS;
