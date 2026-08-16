import React, { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ReferenceSelect from "@/components/patterns/ReferenceSelect";
import api from "@/services/apiClient";
import { LEADS } from "@/constants/testIds";


export default function AddLeadDialog({ open, onOpenChange, onDone }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "manual", interest_unit_type: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.phone) { toast.error("Nama & telepon wajib diisi."); return; }
    setBusy(true);
    try {
      await api.post("/leads", form);
      toast.success("Lead ditambahkan.");
      onOpenChange(false);
      setForm({ name: "", phone: "", email: "", source: "manual", interest_unit_type: "", notes: "" });
      onDone && onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menambah lead.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Lead</DialogTitle>
          <DialogDescription>Lead baru akan otomatis membuat task “Hubungi ≤5 menit”.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="n">Nama</Label>
            <Input id="n" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p">No. Telepon</Label>
            <Input id="p" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+62812..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e">Email (opsional)</Label>
            <Input id="e" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sumber</Label>
            <ReferenceSelect group="lead_source" value={form.source}
              onChange={(v) => set("source", v)} testId="lead-form-source" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="i">Minat Unit (opsional)</Label>
            <ReferenceSelect group="unit_type" value={form.interest_unit_type}
              onChange={(v) => set("interest_unit_type", v)} testId="lead-form-unit-type"
              placeholder="Pilih tipe unit yang diminati" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nt">Catatan (opsional)</Label>
            <Textarea id="nt" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button data-testid={LEADS.createSubmit} onClick={submit} disabled={busy}>
            {busy ? "Menyimpan..." : "Simpan Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
