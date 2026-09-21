export type User = {
  id: string;
  email: string;
  full_name: string;
  contact_number: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: User;
};

export type CurrentUserResult =
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" }
  | { status: "recovering" }
  | { status: "unavailable" };
