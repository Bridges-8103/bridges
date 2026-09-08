export interface CreateUserInput {
  email: string;
  name?: string | null;
}

export interface UpdateUserInput {
  name?: string | null;
  email?: string;
}
