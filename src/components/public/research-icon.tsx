import { Activity, Brain, HeartPulse, Layers, RadioTower, ScanLine, type LucideIcon } from 'lucide-react';
const icons: Record<string, LucideIcon> = { scan: ScanLine, brain: Brain, activity: Activity, radio: RadioTower, layers: Layers, heart: HeartPulse };
export function ResearchIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = icons[name] ?? ScanLine;
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
