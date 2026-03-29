/** Після першого відвідування /app у цій вкладці — лендінг не редіректить автоматично. */
const ENTERED_APP_SESSION_KEY = "chrono_entered_app_session";

export function hasEnteredAppThisSession(): boolean {
  try {
    return sessionStorage.getItem(ENTERED_APP_SESSION_KEY) === "1";
  } catch {
    return true;
  }
}

export function markEnteredAppThisSession(): void {
  try {
    sessionStorage.setItem(ENTERED_APP_SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}
