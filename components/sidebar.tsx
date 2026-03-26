"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Sidebar() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <div className="flex h-screen w-64 flex-col justify-between bg-black text-white">
      <div>
        <div className="p-6 text-3xl font-bold">TimeOn</div>

        <nav className="flex flex-col gap-2 px-4">
          <Link
            href="/dashboard"
            className="rounded p-3 transition hover:bg-zinc-800"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/calendar"
            className="rounded p-3 transition hover:bg-zinc-800"
          >
            Calendar
          </Link>

          {role !== "EMPLOYEE" && (
            <>
              <Link
                href="/dashboard/employees"
                className="rounded p-3 transition hover:bg-zinc-800"
              >
                Employees
              </Link>

              <Link
                href="/dashboard/teams"
                className="rounded p-3 transition hover:bg-zinc-800"
              >
                Teams
              </Link>

              <Link
                href="/dashboard/attendance"
                className="rounded p-3 transition hover:bg-zinc-800"
              >
                Attendance
              </Link>

              <Link
                href="/dashboard/requests"
                className="rounded p-3 transition hover:bg-zinc-800"
              >
                Requests
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg bg-red-500 px-4 py-3 font-medium text-white transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}