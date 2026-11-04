"use client";

import type { Company } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useActionForm } from "@/components/ui/use-action-form";
import type { ActionState } from "@/lib/form";

type CompanyFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  company?: Company;
  submitLabel: string;
};

export function CompanyForm({ action, company, submitLabel }: CompanyFormProps) {
  const { state, pending, formProps } = useActionForm(action);
  const errors = state.fieldErrors ?? {};

  return (
    <form {...formProps} className="grid gap-4 p-5 sm:grid-cols-2">
      <TextField label="Company / builder name" name="name" required defaultValue={company?.name} error={errors.name} className="sm:col-span-2" />
      <TextField label="Contact person" name="contactPerson" defaultValue={company?.contactPerson} error={errors.contactPerson} />
      <TextField label="Phone" name="phone" type="tel" defaultValue={company?.phone} error={errors.phone} />
      <TextField label="Email" name="email" type="email" defaultValue={company?.email} error={errors.email} />
      <TextField label="Website" name="website" type="url" placeholder="https://" defaultValue={company?.website} error={errors.website} />
      <TextField label="City" name="city" defaultValue={company?.city} error={errors.city} />
      <TextField label="Address" name="address" defaultValue={company?.address} error={errors.address} />
      <TextAreaField label="Internal notes" name="notes" rows={3} hint="Only visible to admins." defaultValue={company?.notes} error={errors.notes} className="sm:col-span-2" />
      <div className="space-y-3 sm:col-span-2">
        <FormAlert error={state.error} success={state.success} />
        <Button type="submit" pending={pending}>{submitLabel}</Button>
      </div>
    </form>
  );
}
