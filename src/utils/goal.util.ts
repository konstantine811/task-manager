import type { GoalUnitType } from "@/types/progress.model";

const formatCompactNumber = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
};

export const formatGoalTime = (seconds: number): string => {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours} год ${minutes} хв`;
  if (hours > 0) return `${hours} год`;
  return `${minutes} хв`;
};

export const formatGoalValue = (
  value: number,
  unitType: GoalUnitType,
): string => {
  if (unitType === "time") {
    return formatGoalTime(value);
  }
  return formatCompactNumber(value);
};

export const formatGoalProgressValue = (
  currentValue: number,
  targetValue: number,
  unitType: GoalUnitType,
): string => `${formatGoalValue(currentValue, unitType)}/${formatGoalValue(targetValue, unitType)}`;
