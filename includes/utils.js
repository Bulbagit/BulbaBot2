// @ts-check
/*
 * Contains global helper functions.
 */

import config from "../config.js";

/**
 * Take user input and parse into a duration and SQL interval.
 */
export function getDuration(arg) {
  const measure = arg.trim().toLowerCase().slice(-1);
  const time = parseInt(arg, 10);
  let duration = 1;
  let interval = "INTERVAL " + time.toString();

  switch (measure) {
    case "d":
      interval += " DAY";
      duration = time * 24 * 60 * 60; // d*h*m*s
      break;
    case "h":
      interval += " HOUR";
      duration = time * 60 * 60; // h*m*s
      break;
    case "m":
      interval += " MINUTE";
      duration = time * 60; // m*s
      break;
    case "s":
      interval += " SECOND";
      duration = time;
      break;
    default:
      return false; // Don't recognize the format
  }
  return [duration * 1000, interval];
}

/**
 * Check if the user is allowed to perform a moderation command.
 */
export function canModerate(callerMember, targetMember) {
  // Bot admin exception
  if (callerMember.user.id === config.adminID) return true;

  // Target not in server
  if (!targetMember) return true;

  // Check that the user has a higher position than the target
  return callerMember.roles.highest.position > targetMember.roles.highest.position;
}
