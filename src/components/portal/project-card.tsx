import { Box, Building, MapPin, Maximize2, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";

export type ProjectCardData = {
  id: string;
  name: string;
  tagline: string;
  city: string;
  status: string;
  configuration: string;
  area: string;
  cover: string | null;
  hasModel: boolean;
};

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong">
      <div className="relative aspect-[16/10] overflow-hidden bg-raised">
        {project.cover ? (
          // Covers are private, served by an authenticated route, so next/image can't optimize them.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div
            aria-hidden
            className="grid size-full place-items-center"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          >
            <Box className="size-9 text-line-strong" strokeWidth={1.25} />
          </div>
        )}
        <Badge className="absolute left-3 top-3 bg-bg/85 backdrop-blur">{project.status}</Badge>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-display text-2xl font-semibold leading-tight">{project.name}</h2>
        {project.tagline && <p className="mt-1 text-[13px] text-muted">{project.tagline}</p>}

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-soft">
          {project.city && <li className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-muted" aria-hidden />{project.city}</li>}
          {project.configuration && <li className="inline-flex items-center gap-1.5"><Building className="size-3.5 text-muted" aria-hidden />{project.configuration}</li>}
          {project.area && <li className="inline-flex items-center gap-1.5"><Maximize2 className="size-3.5 text-muted" aria-hidden />{project.area}</li>}
        </ul>

        <div className="mt-auto pt-5">
          {project.hasModel ? (
            <Link href={`/projects/${project.id}`} className={`${buttonClass("primary")} w-full`}>
              <Play className="size-3.5 fill-current" aria-hidden /> View 3D model
            </Link>
          ) : (
            <span className={`${buttonClass("secondary")} w-full cursor-default opacity-60 hover:border-line-strong`}>3D coming soon</span>
          )}
        </div>
      </div>
    </article>
  );
}
