"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { apiClient } from "@/lib/api";
import { CheckCircle, XCircle, Loader2, Upload } from "lucide-react";

type JobStatus = { status: string; progress: number; created: number; failed: number; errors: string[] };

export default function UploadPage() {
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
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Transactions</h1>
      <p className="text-gray-500 text-sm mb-6">Upload a CSV file from your bank. We support most formats.</p>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
          isDragActive ? "border-brand-500 bg-brand-50" : "border-gray-300 hover:border-brand-400 hover:bg-gray-50"
        } ${(uploading || jobId) ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 text-gray-400" size={40} />
        <p className="text-gray-600 font-medium">
          {isDragActive ? "Drop your CSV here" : "Drag & drop your CSV file, or click to browse"}
        </p>
        <p className="text-gray-400 text-sm mt-1">Supports: date, amount, description, merchant columns</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {job && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            {job.status === "done" ? (
              <CheckCircle className="text-green-500" size={22} />
            ) : job.status === "error" ? (
              <XCircle className="text-red-500" size={22} />
            ) : (
              <Loader2 className="text-brand-600 animate-spin" size={22} />
            )}
            <div>
              <p className="font-medium text-gray-900 capitalize">{job.status}</p>
              <p className="text-sm text-gray-500">{job.progress}% complete</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all"
              style={{ width: `${job.progress}%` }}
            />
          </div>

          <div className="flex gap-6 text-sm">
            <div><span className="text-gray-500">Created:</span> <strong className="text-green-600">{job.created}</strong></div>
            <div><span className="text-gray-500">Failed:</span> <strong className="text-red-600">{job.failed}</strong></div>
          </div>

          {job.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {job.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
