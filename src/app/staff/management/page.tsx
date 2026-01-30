"use client";

import { useState, useEffect } from "react";
import {
  UserPlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { staffApi, Staff } from "@/lib/staff-api";
import { format } from "date-fns";

export default function StaffManagementPage() {
  const [users, setUsers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "STAFF",
    branch: "",
  });
  const [enrollStatus, setEnrollStatus] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await staffApi.getStaffUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch staff users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollStatus({ loading: true });
    try {
      await staffApi.enrollStaff(formData);
      setEnrollStatus({
        success: true,
        message: "Staff member enrolled successfully!",
      });
      setFormData({
        username: "",
        password: "",
        fullName: "",
        role: "STAFF",
        branch: "",
      });
      fetchUsers();
      setTimeout(() => setIsEnrollModalOpen(false), 2000);
    } catch (error: any) {
      setEnrollStatus({
        error: true,
        message: error.message || "Failed to enroll staff",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500">
            Manage internal staff accounts and permissions
          </p>
        </div>

        <button
          onClick={() => setIsEnrollModalOpen(true)}
          className="bg-primary text-white py-3 px-6 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <UserPlusIcon className="w-5 h-5" />
          Enroll New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-primary">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-primary/60 font-semibold uppercase">
              Total Staff
            </p>
            <p className="text-2xl font-bold text-primary">{users.length}</p>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-green-600">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-green-600/60 font-semibold uppercase">
              Admins
            </p>
            <p className="text-2xl font-bold text-green-700">
              {users.filter((u) => u.role === "ADMIN").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Full Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Branch
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Loading staff data...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No staff found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{user.fullName}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                      @{user.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          user.role === "ADMIN"
                            ? "bg-purple-50 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1 opacity-40" />
                      {user.branch || "Global"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center text-xs font-bold text-green-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                        ACTIVE
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                      {user.lastLogin
                        ? format(new Date(user.lastLogin), "MMM d, HH:mm")
                        : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                Enroll Staff Member
              </h2>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="p-8 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter username"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Set temporary password"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                      Role
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                    >
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">
                      Branch
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value })
                      }
                    >
                      <option value="">Global</option>
                      <option value="Nairobi">Nairobi</option>
                      <option value="Mombasa">Mombasa</option>
                      <option value="Kisumu">Kisumu</option>
                    </select>
                  </div>
                </div>
              </div>

              {enrollStatus && (
                <div
                  className={`p-4 rounded-2xl flex items-center gap-3 ${
                    enrollStatus.error
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {enrollStatus.error ? (
                    <ExclamationCircleIcon className="w-5 h-5" />
                  ) : (
                    <CheckCircleIcon className="w-5 h-5" />
                  )}
                  <p className="text-sm font-bold">{enrollStatus.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={enrollStatus?.loading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-extrabold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {enrollStatus?.loading ? "Enrolling..." : "Complete Enrollment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
