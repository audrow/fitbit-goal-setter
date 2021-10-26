import type { ActiveStepsConfig } from "./types.ts";

export function getActiveSteps(steps: number[], config: ActiveStepsConfig) {
  const activeSessions = processSteps(steps, config);
  const activeSessionTotals = activeSessions.map((session) =>
    session.reduce((acc, curr) => acc + curr, 0)
  );
  return activeSessionTotals.reduce((acc, curr) => acc + curr, 0);
}

export function processSteps(steps: number[], config: ActiveStepsConfig) {
  const activeSessions: number[][] = [];
  let activeSession: number[] = [];
  let consecutiveGap = 0;
  steps.forEach((step, _) => {
    if (step >= config.minStepsPerMin) {
      consecutiveGap = 0;
      activeSession.push(step);
    } else {
      consecutiveGap++;
    }
    if (consecutiveGap > config.maxInactiveMin) {
      if (activeSession.length >= config.minDuration) {
        activeSessions.push(activeSession);
      }
      activeSession = [];
    }
  });
  if (activeSession.length >= config.minDuration) {
    activeSessions.push(activeSession);
  }
  return activeSessions;
}
