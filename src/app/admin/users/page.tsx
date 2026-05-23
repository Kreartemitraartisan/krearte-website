"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Edit2, Check, X, Filter, Download, UserPlus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  city: string | null;
  createdAt: string;
  orders?: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users");
        const result = await response.json();
        
        if (result.success) {
          setUsers(result.users || []);
        } else {
          if (result.error === "Unauthorized") {
            router.push("/login?callbackUrl=/admin/users");
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router]);

  // Update user role
  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const response = await fetch("/api/admin/users/update-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });

      const result = await response.json();

      if (result.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
        setEditingUser(null);
        alert("✅ User role updated successfully!");
      } else {
        alert("❌ Failed to update user role: " + result.error);
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("❌ Error updating user role");
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-900/50 text-red-200 border-red-700";
      case "designer":
        return "bg-purple-900/50 text-purple-200 border-purple-700";
      case "reseller":
        return "bg-blue-900/50 text-blue-200 border-blue-700";
      default:
        return "bg-krearte-gray-800 text-krearte-gray-300 border-krearte-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-krearte-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-krearte-black mb-2">User Management</h1>
          <p className="text-krearte-gray-600">Manage user roles and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-krearte-gray-300 text-krearte-black rounded-lg hover:bg-krearte-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-krearte-black text-krearte-white rounded-lg hover:bg-krearte-charcoal transition-colors">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards - UPDATED */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-krearte-white p-6 rounded-lg border border-krearte-gray-200">
          <p className="text-sm text-krearte-gray-500 mb-2">Total Users</p>
          <p className="text-3xl font-normal text-krearte-black">{users.length}</p>
        </div>
        
        {/* Retail Customers Only */}
        <div className="bg-krearte-white p-6 rounded-lg border border-krearte-gray-200">
          <p className="text-sm text-krearte-gray-500 mb-2">Retail Customers</p>
          <p className="text-3xl font-normal text-krearte-black">
            {users.filter(u => u.role === "customer").length}
          </p>
        </div>
        
        {/* Designers */}
        <div className="bg-krearte-white p-6 rounded-lg border border-krearte-gray-200">
          <p className="text-sm text-krearte-gray-500 mb-2">Designers</p>
          <p className="text-3xl font-normal text-krearte-black">
            {users.filter(u => u.role === "designer").length}
          </p>
        </div>
        
        {/* Resellers */}
        <div className="bg-krearte-white p-6 rounded-lg border border-krearte-gray-200">
          <p className="text-sm text-krearte-gray-500 mb-2">Resellers</p>
          <p className="text-3xl font-normal text-krearte-black">
            {users.filter(u => u.role === "reseller").length}
          </p>
        </div>
        
        {/* Total Customers (Exclude Admin) */}
        <div className="bg-krearte-black text-krearte-white p-6 rounded-lg">
          <p className="text-sm text-krearte-gray-400 mb-2">Total Customers</p>
          <p className="text-3xl font-normal">
            {users.filter(u => u.role !== "admin").length}
          </p>
          <p className="text-xs text-krearte-gray-400 mt-1">
            (Designer + Reseller + Retail)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-krearte-white p-6 rounded-lg border border-krearte-gray-200 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-krearte-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-krearte-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-krearte-gray-200 rounded-lg focus:outline-none focus:border-krearte-black font-light bg-white"
            >
              <option value="all">All Roles</option>
              <option value="customer">Retail Customer</option>
              <option value="designer">Designer</option>
              <option value="reseller">Reseller</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-krearte-white rounded-lg border border-krearte-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-krearte-gray-50 border-b border-krearte-gray-200">
            <tr>
              <th className="text-left p-4 text-sm font-normal text-krearte-gray-600">Email</th>
              <th className="text-left p-4 text-sm font-normal text-krearte-gray-600">Name</th>
              <th className="text-left p-4 text-sm font-normal text-krearte-gray-600">Phone</th>
              <th className="text-left p-4 text-sm font-normal text-krearte-gray-600">City</th>
              <th className="text-left p-4 text-sm font-normal text-krearte-gray-600">Role</th>
              <th className="text-left p-4 text-sm font-normal text-krearte-gray-600">Joined</th>
              <th className="text-left p-4 text-sm font-normal text-krearte-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-krearte-gray-100 hover:bg-krearte-gray-50">
                <td className="p-4">
                  <p className="font-normal text-krearte-black">{user.email}</p>
                </td>
                <td className="p-4">
                  <p className="font-light text-krearte-gray-600">{user.name || "-"}</p>
                </td>
                <td className="p-4">
                  <p className="font-light text-krearte-gray-600">{user.phone || "-"}</p>
                </td>
                <td className="p-4">
                  <p className="font-light text-krearte-gray-600">{user.city || "-"}</p>
                </td>
                <td className="p-4">
                  {editingUser === user.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="px-3 py-1 border border-krearte-gray-300 rounded text-sm focus:outline-none focus:border-krearte-black bg-white"
                        autoFocus
                      >
                        <option value="customer">Retail Customer</option>
                        <option value="designer">Designer</option>
                        <option value="reseller">Reseller</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleUpdateRole(user.id, newRole)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs px-3 py-1 rounded font-medium border ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <p className="font-light text-krearte-gray-600 text-sm">
                    {new Date(user.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => {
                      setEditingUser(user.id);
                      setNewRole(user.role);
                    }}
                    className="flex items-center gap-2 text-sm text-krearte-gray-600 hover:text-krearte-black transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-krearte-gray-500 font-light">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}