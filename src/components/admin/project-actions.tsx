"use client";

import { EyeOff, Globe, Trash2 } from "lucide-react";
import { deleteProjectAction, setProjectPublishedAction } from "@/actions/projects";
import { ConfirmButton } from "@/components/ui/confirm-button";

type ProjectActionsProps = {
  id: string;
  name: string;
  published: boolean;
  /** Icon-only buttons for table rows; deleting stays on the current page. */
  compact?: boolean;
};

export function ProjectActions({ id, name, published, compact }: ProjectActionsProps) {
  const toggleLabel = published ? "Hide from users" : "Make visible";

  return (
    <>
      <ConfirmButton
        variant={compact ? "ghost" : "secondary"}
        size={compact ? "sm" : "md"}
        ariaLabel={compact ? `${toggleLabel}: ${name}` : undefined}
        title={published ? "Hide this project?" : "Make this project visible?"}
        description={published ? <>Users of this company won&apos;t see {name} any more, and open walkthroughs stop loading.</> : <>All users of this company will see {name} in their portal.</>}
        confirmLabel={published ? "Hide project" : "Make visible"}
        onConfirm={() => setProjectPublishedAction(id, !published)}
      >
        {published ? <EyeOff className={compact ? "size-3.5" : "size-4"} aria-hidden /> : <Globe className={compact ? "size-3.5" : "size-4"} aria-hidden />}
        {!compact && toggleLabel}
      </ConfirmButton>
      <ConfirmButton
        variant={compact ? "ghost" : "danger"}
        size={compact ? "sm" : "md"}
        ariaLabel={`Delete ${name}`}
        title="Delete project?"
        description={<>{name}, its property details, cover image and 3D model will be permanently deleted.</>}
        confirmLabel="Delete project"
        confirmVariant="danger"
        onConfirm={() => deleteProjectAction(id, { goToList: !compact })}
      >
        <Trash2 className={compact ? "size-3.5" : "size-4"} aria-hidden />
      </ConfirmButton>
    </>
  );
}
