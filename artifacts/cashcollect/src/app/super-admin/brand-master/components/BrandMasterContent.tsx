"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Pencil, Search, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/apiBase";
import { useAuth } from "@/context/AuthContext";

interface SavedCountry {
  id: number;
  name: string;
}

interface SavedBrand {
  id: number;
  name: string;
  countryId: number;
  createdAt: string;
}

export default function BrandMasterContent() {
  const { token } = useAuth();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const [countries, setCountries] = useState<SavedCountry[]>([]);
  const [brands, setBrands] = useState<SavedBrand[]>([]);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", countryId: "" });
  const [isAdding, setIsAdding] = useState(false);

  const [editBrand, setEditBrand] = useState<SavedBrand | null>(null);
  const [editName, setEditName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [brandToDelete, setBrandToDelete] = useState<SavedBrand | null>(null);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/countries`);
      const data = await res.json();
      setCountries(data.countries || []);
    } catch {
      toast.error("Failed to load countries");
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (countryFilter !== "all") params.set("countryId", countryFilter);
      const res = await fetch(`${API_BASE}/brands?${params.toString()}`);
      const data = await res.json();
      setBrands(data.brands || []);
    } catch {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, [search, countryFilter]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const countryName = (id: number) =>
    countries.find((c) => c.id === id)?.name ?? "—";

  const handleAdd = async () => {
    if (!newBrand.name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    if (!newBrand.countryId) {
      toast.error("Country is required");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch(`${API_BASE}/brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: newBrand.name.trim(),
          countryId: Number(newBrand.countryId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add brand");
        return;
      }
      toast.success("Brand added successfully");
      setAddOpen(false);
      setNewBrand({ name: "", countryId: "" });
      await fetchBrands();
    } catch {
      toast.error("Failed to add brand");
    } finally {
      setIsAdding(false);
    }
  };

  const openEdit = (brand: SavedBrand) => {
    setEditBrand(brand);
    setEditName(brand.name);
  };

  const handleEditSave = async () => {
    if (!editBrand) return;
    if (!editName.trim()) {
      toast.error("Brand name is required");
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE}/brands/${editBrand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update brand");
        return;
      }
      toast.success("Brand updated successfully");
      setEditBrand(null);
      await fetchBrands();
    } catch {
      toast.error("Failed to update brand");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/brands/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        toast.success("Brand deleted");
        await fetchBrands();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete brand");
      }
    } catch {
      toast.error("Failed to delete brand");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Brand Master
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the brands operated within each country
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Add New Brand
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands…"
            className="pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
          />
        </div>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                  #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Brand
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Country
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Loader2
                      size={20}
                      className="animate-spin mx-auto text-muted-foreground"
                    />
                  </td>
                </tr>
              ) : (
                brands.map((brand, i) => (
                  <tr
                    key={brand.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Tag size={14} className="text-muted-foreground" />
                        {brand.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {countryName(brand.countryId)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {brand.createdAt
                        ? new Date(brand.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(brand)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setBrandToDelete(brand)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && brands.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {search || countryFilter !== "all"
                      ? "No brands match your filters."
                      : "No brands on record yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                Add New Brand
              </h2>
              <button
                onClick={() => setAddOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Country *
                </label>
                <select
                  value={newBrand.countryId}
                  onChange={(e) =>
                    setNewBrand((prev) => ({
                      ...prev,
                      countryId: e.target.value,
                    }))
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select a country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Brand Name *
                </label>
                <input
                  value={newBrand.name}
                  onChange={(e) =>
                    setNewBrand((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Baskin Robbins"
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {isAdding ? "Saving…" : "Save Brand"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                Edit Brand
              </h2>
              <button
                onClick={() => setEditBrand(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Country
                </label>
                <input
                  value={countryName(editBrand.countryId)}
                  disabled
                  className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Brand Name *
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setEditBrand(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isSavingEdit}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {isSavingEdit ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {brandToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="presentation"
        >
          <div
            className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-brand-title"
            aria-describedby="delete-brand-description"
          >
            <div className="px-5 py-4 border-b border-border">
              <h2
                id="delete-brand-title"
                className="text-base font-semibold text-foreground"
              >
                Delete brand?
              </h2>
            </div>
            <div className="px-5 py-4">
              <p
                id="delete-brand-description"
                className="text-sm text-muted-foreground"
              >
                Delete{" "}
                <span className="font-semibold text-foreground">
                  {brandToDelete.name}
                </span>{" "}
                ({countryName(brandToDelete.countryId)})? This action cannot
                be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setBrandToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = brandToDelete.id;
                  setBrandToDelete(null);
                  await handleDelete(id);
                }}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
