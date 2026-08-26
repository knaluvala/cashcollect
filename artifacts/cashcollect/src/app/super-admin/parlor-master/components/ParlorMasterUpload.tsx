"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { API_BASE } from "@/lib/apiBase";

interface ParlorRow {
  parlorCode: string;
  parlorName: string;
  parlorType: string;
  status: "valid" | "error";
  errors: string[];
}

interface SavedParlor {
  id: number;
  parlorCode: string;
  parlorName: string;
  parlorType: string;
  createdAt: string;
  updatedAt: string;
}

const VALID_TYPES = ["Mall", "Standalone", "Event", "Kiosk", "Cart"];

const SAMPLE_DATA = [
  ["Parlor Code", "Parlor Name", "Parlor Type"],
  ["PRL-001", "Andheri West Scoop", "Mall"],
  ["PRL-002", "Bandra Standalone", "Standalone"],
  ["PRL-003", "Juhu Beach Event", "Event"],
];

function validateRow(row: Record<string, string>, index: number): ParlorRow {
  const parlorCode = (
    row["Parlor Code"] ||
    row["parlor_code"] ||
    row["ParlorCode"] ||
    ""
  )
    .toString()
    .trim();
  const parlorName = (
    row["Parlor Name"] ||
    row["parlor_name"] ||
    row["ParlorName"] ||
    ""
  )
    .toString()
    .trim();
  const parlorType = (
    row["Parlor Type"] ||
    row["parlor_type"] ||
    row["ParlorType"] ||
    ""
  )
    .toString()
    .trim();
  const errors: string[] = [];

  if (!parlorCode) errors.push("Parlor Code is required");
  if (!parlorName) errors.push("Parlor Name is required");
  if (!parlorType) errors.push("Parlor Type is required");
  else if (
    !VALID_TYPES.map((t) => t.toLowerCase()).includes(parlorType.toLowerCase())
  ) {
    errors.push(`Parlor Type must be one of: ${VALID_TYPES.join(", ")}`);
  }

  return {
    parlorCode,
    parlorName,
    parlorType:
      VALID_TYPES.find((t) => t.toLowerCase() === parlorType.toLowerCase()) ||
      parlorType,
    status: errors.length === 0 ? "valid" : "error",
    errors,
  };
}

type SortKey = "parlorCode" | "parlorName" | "parlorType" | "status";
type SortDir = "asc" | "desc";
type ExistingSortKey = "parlorCode" | "parlorName" | "parlorType";

const TYPE_COLORS: Record<string, string> = {
  Mall: "bg-blue-50 text-blue-700 border-blue-200",
  Standalone: "bg-purple-50 text-purple-700 border-purple-200",
  Event: "bg-amber-50 text-amber-700 border-amber-200",
  Kiosk: "bg-green-50 text-green-700 border-green-200",
  Cart: "bg-pink-50 text-pink-700 border-pink-200",
};

export default function ParlorMasterUpload() {
  const [rows, setRows] = useState<ParlorRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<
    "idle" | "parsing" | "preview" | "uploading" | "success" | "failed"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("parlorCode");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "error">(
    "all",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newParlor, setNewParlor] = useState({
    parlorCode: "",
    parlorName: "",
    parlorType: "Mall",
  });
  const [isAdding, setIsAdding] = useState(false);

  const [existingParlors, setExistingParlors] = useState<SavedParlor[]>([]);
  const [existingSearch, setExistingSearch] = useState("");
  const [existingSortKey, setExistingSortKey] =
    useState<ExistingSortKey>("parlorCode");
  const [existingSortDir, setExistingSortDir] = useState<SortDir>("asc");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [parlorToDelete, setParlorToDelete] = useState<SavedParlor | null>(
    null,
  );

  const fetchExistingParlors = useCallback(async () => {
    setLoadingExisting(true);
    try {
      const res = await fetch(
        `${API_BASE}/parlors?search=${encodeURIComponent(existingSearch)}`,
      );
      const data = await res.json();
      setExistingParlors(data.parlors || []);
    } catch {
      toast.error("Failed to load parlors");
    } finally {
      setLoadingExisting(false);
    }
  }, [existingSearch]);

  useEffect(() => {
    fetchExistingParlors();
  }, [fetchExistingParlors]);

  const parseFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setErrorMsg("Please upload a valid Excel (.xlsx, .xls) or CSV file.");
      setUploadState("failed");
      return;
    }
    setUploadState("parsing");
    setErrorMsg("");
    setFileName(file.name);
    try {
      const XLSX = await import("@e965/xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: Record<string, string>[] = XLSX.utils.sheet_to_json(
        sheet,
        { defval: "" },
      );

      if (jsonData.length === 0) {
        setErrorMsg("The uploaded file is empty or has no data rows.");
        setUploadState("failed");
        return;
      }

      const parsed = jsonData.map((row, i) => validateRow(row, i));
      setRows(parsed);
      setUploadState("preview");
    } catch {
      setErrorMsg(
        "Failed to parse the file. Please check the format and try again.",
      );
      setUploadState("failed");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleReset = () => {
    setRows([]);
    setFileName("");
    setUploadState("idle");
    setErrorMsg("");
    setFilterStatus("all");
  };

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.status === "valid");
    if (validRows.length === 0) return;
    setUploadState("uploading");

    let saved = 0;
    let failed = 0;
    for (const r of validRows) {
      try {
        const res = await fetch(`${API_BASE}/parlors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parlorCode: r.parlorCode,
            parlorName: r.parlorName,
            parlorType: r.parlorType,
          }),
        });
        if (res.ok) saved++;
        else failed++;
      } catch {
        failed++;
      }
    }

    await fetchExistingParlors();
    setUploadState("success");
    if (failed > 0) {
      toast.warning(`${saved} saved, ${failed} failed (duplicates or errors)`);
    } else {
      toast.success(`${saved} parlor records saved successfully`);
    }
  };

  const handleAddParlor = async () => {
    if (!newParlor.parlorCode.trim()) {
      toast.error("Parlor Code is required");
      return;
    }

    if (!newParlor.parlorName.trim()) {
      toast.error("Parlor Name is required");
      return;
    }

    setIsAdding(true);

    try {
      const res = await fetch(`${API_BASE}/parlors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parlorCode: newParlor.parlorCode.trim().toUpperCase(),
          parlorName: newParlor.parlorName.trim(),
          parlorType: newParlor.parlorType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add parlor");
        return;
      }

      toast.success("Parlor added successfully");
      setAddOpen(false);
      setNewParlor({ parlorCode: "", parlorName: "", parlorType: "Mall" });
      await fetchExistingParlors();
    } catch {
      toast.error("Failed to add parlor");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/parlors/${id}`, {
        method: "DELETE",
        headers: { "X-Parlor-Delete-Confirmed": "true" },
      });
      if (res.ok) {
        toast.success("Parlor deleted");
        await fetchExistingParlors();
      } else {
        toast.error("Failed to delete parlor");
      }
    } catch {
      toast.error("Failed to delete parlor");
    }
  };

  const handleDownloadSample = () => {
    import("@e965/xlsx").then((XLSX) => {
      const ws = XLSX.utils.aoa_to_sheet(SAMPLE_DATA);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Parlor Master");
      XLSX.writeFile(wb, "parlor_master_template.xlsx");
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleExistingSort = (key: ExistingSortKey) => {
    if (existingSortKey === key)
      setExistingSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setExistingSortKey(key);
      setExistingSortDir("asc");
    }
  };

  const validCount = rows.filter((r) => r.status === "valid").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  const displayRows = rows
    .filter((r) => (filterStatus === "all" ? true : r.status === filterStatus))
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const filteredExisting = existingParlors.sort((a, b) => {
    const av = a[existingSortKey] ?? "";
    const bv = b[existingSortKey] ?? "";
    return existingSortDir === "asc"
      ? av.localeCompare(bv)
      : bv.localeCompare(av);
  });

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="inline-flex flex-col ml-1 opacity-50">
      {sortKey === col ? (
        sortDir === "asc" ? (
          <ChevronUp size={12} className="opacity-100 text-primary" />
        ) : (
          <ChevronDown size={12} className="opacity-100 text-primary" />
        )
      ) : (
        <ChevronUp size={12} />
      )}
    </span>
  );

  const ExistingSortIcon = ({ col }: { col: ExistingSortKey }) => (
    <span className="inline-flex flex-col ml-1 opacity-50">
      {existingSortKey === col ? (
        existingSortDir === "asc" ? (
          <ChevronUp size={12} className="opacity-100 text-primary" />
        ) : (
          <ChevronDown size={12} className="opacity-100 text-primary" />
        )
      ) : (
        <ChevronUp size={12} />
      )}
    </span>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Parlor Master Upload
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Upload parlor master data (code, name, type) via Excel or CSV
              sheet
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Add New Record
          </button>
          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Download size={15} />
            Download Template
          </button>
        </div>

        {addOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">
                  Add New Parlor
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
                    Parlor Code *
                  </label>
                  <input
                    value={newParlor.parlorCode}
                    onChange={(e) =>
                      setNewParlor((prev) => ({
                        ...prev,
                        parlorCode: e.target.value,
                      }))
                    }
                    placeholder="e.g. PRL-010"
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Parlor Name *
                  </label>
                  <input
                    value={newParlor.parlorName}
                    onChange={(e) =>
                      setNewParlor((prev) => ({
                        ...prev,
                        parlorName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Dubai Mall Outlet"
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Parlor Type *
                  </label>
                  <select
                    value={newParlor.parlorType}
                    onChange={(e) =>
                      setNewParlor((prev) => ({
                        ...prev,
                        parlorType: e.target.value,
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {VALID_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
                  onClick={handleAddParlor}
                  disabled={isAdding}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {isAdding ? "Saving…" : "Save Parlor"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      {(uploadState === "idle" || uploadState === "failed") && (
        <div className="mb-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer
              transition-all duration-200 py-14 px-6
              ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
              }
            `}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${isDragging ? "bg-primary/10" : "bg-muted"}`}
            >
              <FileSpreadsheet
                size={28}
                className={
                  isDragging ? "text-primary" : "text-muted-foreground"
                }
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragging
                  ? "Drop your file here"
                  : "Drag & drop your Excel file here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or{" "}
                <span className="text-primary font-medium">
                  browse to upload
                </span>{" "}
                · Supports .xlsx, .xls, .csv
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {uploadState === "failed" && errorMsg && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Expected Format */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Expected Columns
            </p>
            <div className="flex flex-wrap gap-2">
              {["Parlor Code", "Parlor Name", "Parlor Type"].map((col) => (
                <span
                  key={col}
                  className="px-2.5 py-1 rounded-md bg-background border border-border text-xs font-medium text-foreground"
                >
                  {col}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Valid Parlor Types:{" "}
              <span className="font-medium text-foreground">
                {VALID_TYPES.join(", ")}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Parsing State */}
      {uploadState === "parsing" && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Parsing file…</p>
        </div>
      )}

      {/* Uploading State */}
      {uploadState === "uploading" && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            Saving parlor records…
          </p>
        </div>
      )}

      {/* Success State */}
      {uploadState === "success" && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={36} className="text-green-600" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">
              Upload Successful
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {validCount} parlor record{validCount !== 1 ? "s" : ""} saved
              successfully.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="mt-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upload Another File
          </button>
        </div>
      )}

      {/* Preview Table */}
      {uploadState === "preview" && (
        <>
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm">
              <FileSpreadsheet size={15} className="text-muted-foreground" />
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {fileName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              <CheckCircle2 size={14} />
              <span className="font-semibold">{validCount}</span>
              <span>valid</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <XCircle size={14} />
                <span className="font-semibold">{errorCount}</span>
                <span>error{errorCount !== 1 ? "s" : ""}</span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Trash2 size={14} />
                Clear
              </button>
              <button
                onClick={handleSubmit}
                disabled={validCount === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload size={14} />
                Save {validCount} Record{validCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mb-3">
            {(["all", "valid", "error"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  filterStatus === f
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f === "all"
                  ? `All (${rows.length})`
                  : f === "valid"
                    ? `Valid (${validCount})`
                    : `Errors (${errorCount})`}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                      #
                    </th>
                    {(
                      [
                        { key: "parlorCode", label: "Parlor Code" },
                        { key: "parlorName", label: "Parlor Name" },
                        { key: "parlorType", label: "Parlor Type" },
                        { key: "status", label: "Status" },
                      ] as { key: SortKey; label: string }[]
                    ).map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                      >
                        {col.label}
                        <SortIcon col={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`transition-colors ${row.status === "error" ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-muted/30"}`}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                        {row.parlorCode || (
                          <span className="text-muted-foreground italic">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {row.parlorName || (
                          <span className="text-muted-foreground italic">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.parlorType ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[row.parlorType] || "bg-muted text-foreground border-border"}`}
                          >
                            {row.parlorType}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.status === "valid" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <CheckCircle2 size={13} />
                            Valid
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                              <XCircle size={13} />
                              Error
                            </span>
                            <ul className="mt-0.5 space-y-0.5">
                              {row.errors.map((e, ei) => (
                                <li
                                  key={ei}
                                  className="text-[11px] text-red-500"
                                >
                                  · {e}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {displayRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No rows match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {errorCount > 0 && (
            <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-500" />
              Rows with errors will be skipped. Only {validCount} valid row
              {validCount !== 1 ? "s" : ""} will be saved.
            </p>
          )}
        </>
      )}

      {/* ── Existing Parlors Table ── */}
      {(uploadState === "idle" ||
        uploadState === "failed" ||
        uploadState === "success") && (
        <div className="mt-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Existing Parlors
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {existingParlors.length} parlor
                {existingParlors.length !== 1 ? "s" : ""} on record
              </p>
            </div>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={existingSearch}
                onChange={(e) => setExistingSearch(e.target.value)}
                placeholder="Search parlors…"
                className="pl-8 pr-3 py-2 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                      #
                    </th>
                    {[
                      {
                        key: "parlorCode" as ExistingSortKey,
                        label: "Parlor Code",
                      },
                      {
                        key: "parlorName" as ExistingSortKey,
                        label: "Parlor Name",
                      },
                      {
                        key: "parlorType" as ExistingSortKey,
                        label: "Parlor Type",
                      },
                      { key: "createdAt" as ExistingSortKey, label: "Created" },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() =>
                          handleExistingSort(col.key as ExistingSortKey)
                        }
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                      >
                        {col.label}
                        <ExistingSortIcon col={col.key as ExistingSortKey} />
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loadingExisting ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center">
                        <Loader2
                          size={20}
                          className="animate-spin mx-auto text-muted-foreground"
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredExisting.map((parlor, i) => (
                      <tr
                        key={parlor.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                          {parlor.parlorCode}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {parlor.parlorName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[parlor.parlorType] || "bg-muted text-foreground border-border"}`}
                          >
                            {parlor.parlorType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {parlor.createdAt
                            ? new Date(parlor.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setParlorToDelete(parlor)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {!loadingExisting && filteredExisting.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        {existingSearch
                          ? "No parlors match your search."
                          : "No parlors on record yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {parlorToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="presentation"
        >
          <div
            className="w-full max-w-md bg-card rounded-xl border border-border shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-parlor-title"
            aria-describedby="delete-parlor-description"
          >
            <div className="px-5 py-4 border-b border-border">
              <h2
                id="delete-parlor-title"
                className="text-base font-semibold text-foreground"
              >
                Delete parlor?
              </h2>
            </div>
            <div className="px-5 py-4">
              <p
                id="delete-parlor-description"
                className="text-sm text-muted-foreground"
              >
                Delete parlor{" "}
                <span className="font-semibold text-foreground">
                  {parlorToDelete.parlorName} ({parlorToDelete.parlorCode})
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setParlorToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const parlorId = parlorToDelete.id;
                  setParlorToDelete(null);
                  await handleDelete(parlorId);
                }}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete parlor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
