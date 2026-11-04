"use client";

import { KeyRound, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteUserAction, resetPasscodeAction, setUserActiveAction } from "@/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Table, Td, Th } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { ActionState } from "@/lib/form";
import { CredentialsDialog } from "./credentials-dialog";
import { PasscodeCell } from "./passcode-cell";
import { UserEditDialog } from "./user-edit-dialog";

export type UserRow = {
  id: string;
  name: string;
  username: string;
  active: boolean;
  lastLoginAt: Date | null;
  updatedAt: Date;
  company: { id: string; name: string } | null;
};

export function UserTable({ users, companies, showCompany = true }: { users: UserRow[]; companies: { id: string; name: string }[]; showCompany?: boolean }) {
  const [credentials, setCredentials] = useState<NonNullable<ActionState["credentials"]> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = users.find((user) => user.id === editingId);

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>User</Th>
            <Th>User ID</Th>
            <Th>Passcode</Th>
            {showCompany && <Th>Company</Th>}
            <Th>Status</Th>
            <Th>Last sign in</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <Td className="font-medium text-ink">{user.name}</Td>
              <Td className="font-mono text-[13px]">{user.username}</Td>
              <Td><PasscodeCell key={user.updatedAt.getTime()} userId={user.id} userName={user.name} /></Td>
              {showCompany && (
                <Td>{user.company && <Link href={`/admin/companies/${user.company.id}`} className="hover:text-gold-light">{user.company.name}</Link>}</Td>
              )}
              <Td>{user.active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</Td>
              <Td>{formatDate(user.lastLoginAt)}</Td>
              <Td>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" aria-label={`Edit ${user.name}`} onClick={() => setEditingId(user.id)}>
                    <Pencil className="size-3.5" aria-hidden /> Edit
                  </Button>
                  <ConfirmButton
                    variant="ghost"
                    ariaLabel={`Reset passcode for ${user.name}`}
                    title="Reset passcode?"
                    description={<>A new passcode is generated. {user.name} will be signed out, and the current passcode stops working.</>}
                    confirmLabel="Reset passcode"
                    onConfirm={async () => {
                      const result = await resetPasscodeAction(user.id);
                      if (result.credentials) setCredentials(result.credentials);
                    }}
                  >
                    <KeyRound className="size-3.5" aria-hidden />
                  </ConfirmButton>
                  <ConfirmButton
                    variant="ghost"
                    ariaLabel={`${user.active ? "Deactivate" : "Activate"} ${user.name}`}
                    title={user.active ? "Deactivate user?" : "Activate user?"}
                    description={user.active ? <>{user.name} will be signed out and won&apos;t be able to sign in until reactivated.</> : <>{user.name} will be able to sign in again with the same passcode.</>}
                    confirmLabel={user.active ? "Deactivate" : "Activate"}
                    onConfirm={() => setUserActiveAction(user.id, !user.active)}
                  >
                    {user.active ? <UserX className="size-3.5" aria-hidden /> : <UserCheck className="size-3.5" aria-hidden />}
                  </ConfirmButton>
                  <ConfirmButton
                    variant="ghost"
                    ariaLabel={`Delete ${user.name}`}
                    title="Delete user?"
                    description={<>{user.name} ({user.username}) will be permanently removed. The company and its projects stay.</>}
                    confirmLabel="Delete user"
                    confirmVariant="danger"
                    onConfirm={() => deleteUserAction(user.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </ConfirmButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {editing && (
        <UserEditDialog
          user={editing}
          companies={companies}
          onClose={() => setEditingId(null)}
          onPasscodeChanged={(next) => {
            setEditingId(null);
            setCredentials(next);
          }}
        />
      )}
      <CredentialsDialog title="New passcode" credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  );
}
