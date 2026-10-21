export const authErrorMessages = {
  invalidCredentials: "The email or password is incorrect.",
  serviceUnavailable:
    "We could not reach the authentication service. Try again.",
  unexpected: "Something went wrong while signing you in. Try again.",
  tooManyAttempts: (retryAfterSeconds: number) =>
    `Too many sign-in attempts. Try again in ${retryAfterSeconds} seconds.`,
  capsLockOn: "Caps Lock is on",
};
