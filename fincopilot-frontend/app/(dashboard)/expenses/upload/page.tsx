"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { apiClient } from "@/lib/api";
import { CheckCircle, XCircle, Loader2, Upload, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type JobStatus = { status: string; progress: number; created: number; failed: number; errors: string[] };

export default function UploadPage() {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pollStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await apiClient.getJobStatus(id);
        setJob(status);
        if (status.status === "done" || status.status === "error") clearInterval(interval);
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  };

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    setError("");
    try {
      const res = await apiClient.uploadCSV(files[0]);
      setJobId(res.job_id);
      setJob({ status: "queued", progress: 0, created: 0, failed: 0, errors: [] });
      pollStatus(res.job_id);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
    disabled: uploading || !!jobId,
  });

  return (
    <div className="p-6 max-w-xl animate-fade-in">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Import Transactions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload a CSV file from your bank. We support most formats.</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-violet-500/60 bg-violet-500/10"
            : "border-white/10 hover:border-violet-500/40 hover:bg-white/[0.03]"
        } ${(uploading || jobId) ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
          <Upload size={20} className={isDragActive ? "text-violet-400" : "text-slate-500"} />
        </div>
        <p className="text-slate-200 font-medium text-sm">
          {isDragActive ? "Drop your CSV here" : "Drag & drop your CSV, or click to browse"}
        </p>
        <p className="text-slate-600 text-xs mt-1.5">Supports: date, amount, description, merchant columns</p>
      </div>

      {error && (
        <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {job && (
        <div className="mt-6 glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            {job.status === "done" ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-400" />
              </div>
            ) : job.status === "error" ? (
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <XCircle size={18} className="text-rose-400" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Loader2 size={18} className="text-violet-400 animate-spin" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-100 text-sm capitalize">{job.status}</p>
              <p className="text-xs text-slate-500">{job.progress}% complete</p>
            </div>
          </div>

          <div className="w-full bg-white/[0.06] rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>

          <div className="flex gap-6 text-xs">
            <div className="text-slate-500">Created: <strong className="text-emerald-400">{job.created}</strong></div>
            <div className="text-slate-500">Failed: <strong className="text-rose-400">{job.failed}</strong></div>
          </div>

          {job.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {job.errors.map((e, i) => (
                <p key={i} className="text-xs text-rose-400">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
