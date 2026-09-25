"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Pencil, Search, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/apiBase";
import { useAuth } from "@/context/AuthContext";

interface SavedCountry {
  id: number;
  name: string;
  createdAt: string;
}

export default function CountryMasterContent() {
  const { token } = useAuth();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const [countries, setCountries] = useState<SavedCountry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editCountry, setEditCountry] = useState<SavedCountry | null>(null);
  const [editName, setEditName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [countryToDelete, setCountryToDelete] = useState<SavedCountry | null>(
    null,
  );

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/countries?search=${encodeURIComponent(search)}`,
      );
      const data = await res.json();
      setCountries(data.countries || []);
    } catch {
      toast.error("Failed to load countries");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Country name is required");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch(`${API_BASE}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add country");
        return;
      }
      toast.success("Country added successfully");
      setAddOpen(false);
      setNewName("");
      await fetchCountries();
    } catch {
      toast.error("Failed to add country");
    } finally {
      setIsAdding(false);
    }
  };

  const openEdit = (country: SavedCountry) => {
    setEditCountry(country);
    setEditName(country.name);
  };

  const handleEditSave = async () => {
    if (!editCountry) return;
    if (!editName.trim()) {
      toast.error("Country name is required");
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE}/countries/${editCountry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update country");
        return;
      }
      toast.success("Country updated successfully");
      setEditCountry(null);
      await fetchCountries();
    } catch {
      toast.error("Failed to update country");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/countries/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (res.ok) {
        toast.success("Country deleted");
        await fetchCountries();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete country");
      }
    } catch {
      toast.error("Failed to delete country");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Country Master
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the countries operations are run in
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Add New Country
        </button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search countries…"
          className="pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
        />
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
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <Loader2
                      size={20}
                      className="animate-spin mx-auto text-muted-foreground"
                    />
                  </td>
                </tr>
              ) : (
                countries.map((country, i) => (
                  <tr
                    key={country.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Globe size={14} className="text-muted-foreground" />
                        {country.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {country.createdAt
                        ? new Date(country.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEdit(country)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setCountryToDelete(country)}
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
              {!loading && countries.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {search
                      ? "No countries match your search."
                      : "No countries on record yet."}
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
                Add New Country
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
                  Country Name *
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. KSA"
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
                {isAdding ? "Saving…" : "Save Country"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                Edit Country
              </h2>
              <button
                onClick={() => setEditCountry(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Country Name *
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
                onClick={() => setEditCountry(null)}
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

      {countryToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="presentation"
        >
          <div
            className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-country-title"
            aria-describedby="delete-country-description"
          >
            <div className="px-5 py-4 border-b border-border">
              <h2
                id="delete-country-title"
                className="text-base font-semibold text-foreground"
              >
                Delete country?
              </h2>
            </div>
            <div className="px-5 py-4">
              <p
                id="delete-country-description"
                className="text-sm text-muted-foreground"
              >
                Delete{" "}
                <span className="font-semibold text-foreground">
                  {countryToDelete.name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setCountryToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = countryToDelete.id;
                  setCountryToDelete(null);
                  await handleDelete(id);
                }}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete country
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
