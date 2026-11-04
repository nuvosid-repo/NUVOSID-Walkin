"use client";

import { useEffect, useState } from "react";
import { createUserAction } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useActionForm } from "@/components/ui/use-action-form";
import { CredentialsDialog } from "./credentials-dialog";

function suggestUsername(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 40);
}

export function UserCreateForm({ companies, defaultCompanyId }: { companies: { id: string; name: string }[]; defaultCompanyId?: string }) {
  const { state, pending, formProps } = useActionForm(createUserAction);
  const errors = state.fieldErrors ?? {};
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    if (!state.credentials) return;
    // A user was just created: clear the form and show the login details once.
    /* eslint-disable react-hooks/set-state-in-effect */
    setName("");
    setUsername("");
    setUsernameEdited(false);
    setPasscode("");
    setShowCredentials(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [state.credentials]);

  return (
    <>
      <form {...formProps} className="grid gap-4 p-5 sm:grid-cols-2">
        <SelectField label="Company" name="companyId" required defaultValue={defaultCompanyId ?? ""} error={errors.companyId} className="sm:col-span-2">
          <option value="" disabled>Select a company</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </SelectField>
        <TextField
          label="Person's name"
          name="name"
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!usernameEdited) setUsername(suggestUsername(event.target.value));
          }}
          error={errors.name}
        />
        <TextField
          label="User ID"
          name="username"
          required
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setUsernameEdited(true);
          }}
          error={errors.username}
          hint="This is what the user signs in with."
        />
        <TextField
          label="Passcode"
          name="passcode"
          autoComplete="off"
          placeholder="Leave empty to auto-generate"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          error={errors.passcode}
          hint="A strong 10-character passcode is generated if left empty."
          className="sm:col-span-2"
        />
        <div className="space-y-3 sm:col-span-2">
          <FormAlert error={state.error} />
          <Button type="submit" pending={pending}>Create user</Button>
        </div>
      </form>
      <CredentialsDialog
        title="User created"
        credentials={showCredentials ? state.credentials ?? null : null}
        onClose={() => setShowCredentials(false)}
      />
    </>
  );
}
