"use client";

import { Trash2 } from "lucide-react";
import { deleteCompanyAction } from "@/actions/companies";
import { ConfirmButton } from "@/components/ui/confirm-button";

export function DeleteCompanyButton({ id, name, users, projects, compact }: { id: string; name: string; users: number; projects: number; compact?: boolean }) {
  return (
    <ConfirmButton
      size={compact ? "sm" : "md"}
      variant={compact ? "ghost" : "danger"}
      confirmVariant="danger"
      ariaLabel={compact ? `Delete ${name}` : undefined}
      title="Delete company?"
      description={<>{name} will be permanently deleted, with its {users} {users === 1 ? "user" : "users"} and {projects} {projects === 1 ? "project" : "projects"}, including 3D models.</>}
      confirmLabel="Delete company"
      onConfirm={() => deleteCompanyAction(id)}
    >
      <Trash2 className={compact ? "size-3.5" : "size-4"} aria-hidden />
      {!compact && "Delete"}
    </ConfirmButton>
  );
}
