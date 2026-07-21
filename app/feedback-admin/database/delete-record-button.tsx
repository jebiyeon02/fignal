"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminTableKey } from "../../../db/admin-database";
import styles from "./database.module.css";

export function DeleteRecordButton({ table, tableLabel, recordId }: {
  table: AdminTableKey;
  tableLabel: string;
  recordId: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const deleteRecord = async () => {
    const confirmed = window.confirm(`${tableLabel} 레코드를 영구 삭제할까요? 연결된 데이터도 함께 삭제될 수 있습니다.`);
    if (!confirmed) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/feedback-admin/database/records", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id: recordId, confirmation: "DELETE" }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "삭제하지 못했습니다.");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "삭제하지 못했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button type="button" className={styles.deleteButton} onClick={deleteRecord} disabled={deleting}>
      {deleting ? <LoaderCircle size={13} className={styles.spinner} /> : <Trash2 size={13} />}
      {deleting ? "삭제 중" : "삭제"}
    </button>
  );
}
