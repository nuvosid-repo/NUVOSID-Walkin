"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectCard, type ProjectCardData } from "./project-card";

const SEARCH_THRESHOLD = 4;

export function ProjectBrowser({ projects }: { projects: ProjectCardData[] }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) => `${project.name} ${project.city} ${project.tagline}`.toLowerCase().includes(term));
  }, [projects, query]);

  return (
    <>
      {projects.length >= SEARCH_THRESHOLD && (
        <div className="relative mb-6 sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-muted/70 focus:border-gold focus:outline-none"
          />
        </div>
      )}
      {visible.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted">No projects match “{query}”.</p>
      )}
    </>
  );
}
