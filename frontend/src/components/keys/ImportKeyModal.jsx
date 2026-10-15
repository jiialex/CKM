import { useState } from "react";
import { motion } from "framer-motion";
import { X, Upload, FileText, CheckCircle2 } from "lucide-react";
import { Button, Input } from "../ui/Core";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

export default function ImportKeyModal({ onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    alias: "",
    fileType: "PEM",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Read preview snippet strictly for diagnostic validation bounds checking
    if (file.type.includes("text") || file.name.endsWith(".pem") || file.name.endsWith(".crt") || file.name.endsWith(".pub")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        setFilePreview(text.length > 220 ? text.slice(0, 220) + "\n... [TRUNCATED METADATA BLOCK]" : text);
      };
      reader.readAsText(file);
    } else {
      setFilePreview("[Binary contents compiled - rendering skipped]");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) return toast.error("Please mount a valid local filesystem resource file");
    if (!form.alias?.trim()) return toast.error("Resource naming identifier alias is required");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append(
      "request",
      new Blob([JSON.stringify({ alias: form.alias.trim(), fileType: form.fileType })], {
        type: "application/json",
      })
    );

    setLoading(true);

    try {
      await api.post("/keys/manage/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("✅ Target node injected into local validation trust block store");
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Import execution operation interrupted");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white dark:bg-[#111823] border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Header Block Panel */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#161F2E] border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600/10 rounded-lg flex items-center justify-center">
              <Upload className="text-emerald-500" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Import Public Key Payload</h2>
              <p className="text-[11px] text-slate-400 font-medium">Mount external validation anchor nodes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        {/* Input Map Parameters Fields Wrapper Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <Input
            label="IMPORTED KEY SCHEMATIC ALIAS"
            placeholder="e.g. peer-service-endpoint-2026"
            value={form.alias}
            onChange={(e) => setForm({ ...form, alias: e.target.value })}
            required
            className="text-xs"
          />

          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">File Encoding Archetype</label>
            <select
              className="w-full bg-slate-50 dark:bg-[#182230] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-slate-800 dark:text-white font-semibold focus:border-blue-500 outline-none transition-colors"
              value={form.fileType}
              onChange={(e) => setForm({ ...form, fileType: e.target.value })}
            >
              <option value="PEM">PEM standard format block base64 ASCII</option>
              <option value="CRT">CRT / CER standard X509 certificate structural node</option>
            </select>
          </div>

          {/* Interactive File Drag Drop Area Card Zone */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Mount Source Storage Node File</label>
            <label className={`flex flex-col items-center justify-center w-full h-28 border border-dashed rounded-xl cursor-pointer transition-all ${
              selectedFile 
                ? "border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/5" 
                : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151E2C] hover:bg-slate-100/60 dark:hover:bg-[#1c293c]"
            }`}>
              {selectedFile ? (
                <CheckCircle2 size={24} className="text-emerald-500 mb-1.5 animate-pulse" />
              ) : (
                <Upload size={22} className="text-slate-400 mb-1.5" />
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-xs truncate text-center px-4">
                {selectedFile ? selectedFile.name : "Select public target anchor file from device"}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Accepts file extensions: .pem, .crt, .cer, .pub</span>
              <input
                type="file"
                className="hidden"
                accept=".pem,.crt,.cer,.pub"
                onChange={handleFileChange}
              />
            </label>

            {/* Diagnostic Armor Raw Header Readout Viewer Preview Canvas Box */}
            {filePreview && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <FileText size={11} /> File Payload Struct Headers Peek
                </div>
                <pre className="text-[10px] bg-slate-900 text-slate-400 p-3 rounded-lg overflow-x-auto font-mono max-h-24 border border-slate-800 leading-normal shadow-inner select-text select-none">
                  {filePreview}
                </pre>
              </div>
            )}
          </div>

          {/* Modal Action Options Footer Row */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1 text-xs font-semibold py-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedFile} 
              className={`flex-1 text-xs font-semibold py-2 shadow-sm ${
                !selectedFile ? "bg-slate-200 dark:bg-slate-800 text-slate-400" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {loading ? "Injected Node Syncing..." : "Commit Key Node"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}