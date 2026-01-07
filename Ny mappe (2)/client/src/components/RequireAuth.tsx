import React from "react";
import { Navigate } from "react-router-dom";
import { currentUser } from "../app/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const me = currentUser();
  if (!me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
