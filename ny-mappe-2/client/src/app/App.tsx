import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout";
import { LoginPage } from "../pages/Login";
import { DashboardPage } from "../pages/Dashboard";
import { BooksPage } from "../pages/Books";
import { BookDetailsPage } from "../pages/BookDetails";
import { LoansPage } from "../pages/Loans";
import { AdminPage } from "../pages/admin/Admin";
import { RequireAuth } from "../components/RequireAuth";
import { RequireAdmin } from "../components/RequireAdmin";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/books"
          element={
            <RequireAuth>
              <BooksPage />
            </RequireAuth>
          }
        />
        <Route
          path="/books/:id"
          element={
            <RequireAuth>
              <BookDetailsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/loans"
          element={
            <RequireAuth>
              <LoansPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
