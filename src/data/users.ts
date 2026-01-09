export interface User {
  username: string;
  password: string;
}

// Example users table
export const users: User[] = [
  { username: "admin", password: "password" },
];
