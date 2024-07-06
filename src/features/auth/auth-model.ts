export type LoginRequest = {
  email_or_phone_number: string;
  password: string;
}

export type LoginResponse = {
  token: string;
}

export type CurrentLoggedInUserResponse = {
  user_id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  company: {
    name: string;
  };
  department: {
    name: string;
  };
  employment_status: {
    name: string;
  };
  job_position: {
    name: string;
  };
  role: {
    name: string;
  };
};