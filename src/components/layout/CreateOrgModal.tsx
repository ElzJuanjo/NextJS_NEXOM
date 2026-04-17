"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useCreateOrg } from "@/hooks/use-org";
import { Spinner } from "@/components/ui/Spinner";

interface CreateOrgModalProps {
  open: boolean;
}

export function CreateOrgModal({ open }: CreateOrgModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const createOrg = useCreateOrg();

  const handleNameChange = (v: string) => {
    setName(v);
    // Auto-generate slug
    setSlug(
      v
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 100)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    createOrg.mutate({ name: name.trim(), slug: slug.trim() });
  };

  return (
    <Modal open={open} title="Create your organization" closable={false}>
      <p className="text-sm text-muted-foreground mb-4">
        You need an organization to start using NEXOM. This will be your main workspace.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Organization name
          </label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Online Store"
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
            required
            minLength={2}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Slug (URL)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-online-store"
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
            required
            minLength={2}
          />
          <p className="text-xs text-muted-foreground mt-1">Only lowercase letters, numbers and hyphens</p>
        </div>
        <button
          type="submit"
          disabled={createOrg.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
        >
          {createOrg.isPending ? (
            <Spinner className="w-4 h-4 text-primary-foreground" />
          ) : (
            <>
              <Building2 className="w-4 h-4" />
              Create organization
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
