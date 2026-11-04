"use client";

import type { Project } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useActionForm } from "@/components/ui/use-action-form";
import { PROJECT_STATUSES, PROPERTY_TYPES } from "@/lib/constants";
import type { ActionState } from "@/lib/form";

type ProjectFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  companies: { id: string; name: string }[];
  project?: Project;
  defaultCompanyId?: string;
  submitLabel: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ProjectForm({ action, companies, project, defaultCompanyId, submitLabel }: ProjectFormProps) {
  const { state, pending, formProps } = useActionForm(action);
  const errors = state.fieldErrors ?? {};

  return (
    <form {...formProps} className="space-y-7 p-5">
      <Section title="Project">
        <SelectField label="Company / builder" name="companyId" required defaultValue={project?.companyId ?? defaultCompanyId ?? ""} error={errors.companyId} hint="Users of this company will see the project.">
          <option value="" disabled>Select a company</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </SelectField>
        <TextField label="Project name" name="name" required defaultValue={project?.name} error={errors.name} />
        <TextField label="Tagline" name="tagline" placeholder="e.g. Sample flat · Tower A" defaultValue={project?.tagline} error={errors.tagline} className="sm:col-span-2" />
        <SelectField label="Property type" name="propertyType" defaultValue={project?.propertyType ?? PROPERTY_TYPES[0]} error={errors.propertyType}>
          {PROPERTY_TYPES.map((type) => <option key={type}>{type}</option>)}
        </SelectField>
        <SelectField label="Status" name="status" defaultValue={project?.status ?? PROJECT_STATUSES[1]} error={errors.status}>
          {PROJECT_STATUSES.map((status) => <option key={status}>{status}</option>)}
        </SelectField>
      </Section>

      <Section title="Location">
        <TextField label="City" name="city" defaultValue={project?.city} error={errors.city} />
        <TextField label="Address" name="address" defaultValue={project?.address} error={errors.address} />
      </Section>

      <Section title="Property details">
        <TextField label="Configuration" name="configuration" placeholder="e.g. 2 & 3 BHK" defaultValue={project?.configuration} error={errors.configuration} />
        <TextField label="Area" name="area" placeholder="e.g. 1834 sq.ft" defaultValue={project?.area} error={errors.area} />
        <TextField label="Price range" name="priceRange" placeholder="e.g. ₹85 L – ₹1.2 Cr" defaultValue={project?.priceRange} error={errors.priceRange} />
        <TextField label="Possession" name="possession" placeholder="e.g. Dec 2027" defaultValue={project?.possession} error={errors.possession} />
        <TextField label="Total floors" name="totalFloors" defaultValue={project?.totalFloors} error={errors.totalFloors} />
        <TextField label="Total units" name="totalUnits" defaultValue={project?.totalUnits} error={errors.totalUnits} />
        <TextField label="RERA number" name="reraNumber" defaultValue={project?.reraNumber} error={errors.reraNumber} className="sm:col-span-2" />
        <TextField label="Amenities" name="amenities" placeholder="Clubhouse, Gym, Parking" hint="Separate with commas." defaultValue={project?.amenities} error={errors.amenities} className="sm:col-span-2" />
        <TextAreaField label="Description" name="description" rows={4} defaultValue={project?.description} error={errors.description} className="sm:col-span-2" />
      </Section>

      <Section title="Cover image">
        <TextField
          label={project?.coverExt ? "Replace cover image" : "Cover image"}
          name="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hint="JPG, PNG or WebP, up to 10 MB. Shown on the project card."
          error={errors.cover}
          className="sm:col-span-2 [&_input]:h-auto [&_input]:cursor-pointer [&_input]:py-2 [&_input]:file:mr-3 [&_input]:file:cursor-pointer [&_input]:file:rounded-md [&_input]:file:border-0 [&_input]:file:bg-raised [&_input]:file:px-3 [&_input]:file:py-1 [&_input]:file:text-[13px] [&_input]:file:text-ink"
        />
        {project?.coverExt && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-soft sm:col-span-2">
            <input type="checkbox" name="removeCover" className="size-4 accent-[var(--color-gold)]" />
            Remove the current cover image
          </label>
        )}
      </Section>

      <div className="space-y-3">
        <FormAlert error={state.error} success={state.success} />
        <Button type="submit" pending={pending}>{submitLabel}</Button>
      </div>
    </form>
  );
}
