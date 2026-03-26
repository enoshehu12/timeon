"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded bg-black px-4 py-2 text-white"
    >
      Logout
    </button>
  );
}