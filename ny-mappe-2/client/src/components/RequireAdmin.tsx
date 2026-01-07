import React from "react";
import { Navigate } from "react-router-dom";
import { currentUser } from "../app/auth";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const me = currentUser();
  if (!me) return <Navigate to="/login" replace />;
  if (me.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}
