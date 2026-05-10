import {
  hasEnteredAppThisSessionSnapshot,
  markEnteredAppThisSessionSnapshot,
} from "@/storage/appSessionStore";

export function hasEnteredAppThisSession(): boolean {
  return hasEnteredAppThisSessionSnapshot();
}

export function markEnteredAppThisSession(): void {
  markEnteredAppThisSessionSnapshot();
}
