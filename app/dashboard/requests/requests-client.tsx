"use client";

import { useEffect, useState } from "react";

type RequestItem = {
  id: string;
  type: string;
  requestedTime: string;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
  };
};

export default function RequestsClientPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const fetchRequests = async () => {
    const res = await fetch("/api/attendance/requests");
    const data = await res.json();
    setRequests(data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: string) => {
    await fetch("/api/attendance/requests/approve", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestId: id,
        action,
      }),
    });

    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Requests</h1>
      <p className="text-gray-600">
        Këtu TL dhe Manager do shohin dhe menaxhojnë kërkesat.
      </p>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {requests.length === 0 ? (
          <p className="text-gray-500">No requests found.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="border-b py-4 last:border-b-0">
              <p className="font-medium">
                {req.employee.firstName} {req.employee.lastName} - {req.type}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(req.requestedTime).toLocaleString()}
              </p>
              <p className="mt-1 text-sm">Status: {req.status}</p>

              {req.status === "PENDING" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAction(req.id, "APPROVE")}
                    className="rounded bg-green-500 px-3 py-1 text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "REJECT")}
                    className="rounded bg-red-500 px-3 py-1 text-white"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}