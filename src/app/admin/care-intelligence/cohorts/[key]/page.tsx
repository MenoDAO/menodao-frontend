"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { Loader2 } from "lucide-react";

export default function CareCohortPage() {
  const params = useParams<{ key: string }>();
  const key = params.key;
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "care-cohort", key],
    queryFn: () => adminApi.getCareCohort(key),
    enabled: Boolean(key),
  });

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-emerald-400 hover:underline">
        ← Care Intelligence
      </Link>
      <h1 className="text-2xl font-bold text-white">Action cohort</h1>
      {isLoading && <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />}
      {error && <p className="text-red-400">{(error as Error).message}</p>}
      {data && (
        <>
          <p className="text-sm text-gray-400">{data.definition}</p>
          <p className="text-xs text-gray-500">
            Membership and contact fields only. Clinical records are not included.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">County</th>
                <th className="pb-2">Registered</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.id} className="border-t border-gray-700">
                  <td className="py-2 text-white">{m.fullName || "—"}</td>
                  <td className="py-2 text-gray-300">{m.phoneNumber}</td>
                  <td className="py-2 text-gray-300">{m.county || "—"}</td>
                  <td className="py-2 text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
