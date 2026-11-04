import { Box, Pencil, Upload } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { ProjectActions } from "./project-actions";

type ProjectRow = {
  id: string;
  name: string;
  city: string;
  status: string;
  published: boolean;
  modelVersion: string | null;
  updatedAt: Date;
  company: { id: string; name: string };
};

export function ProjectTable({ projects, showCompany = true }: { projects: ProjectRow[]; showCompany?: boolean }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Project</Th>
          {showCompany && <Th>Company</Th>}
          <Th>Status</Th>
          <Th>3D model</Th>
          <Th>Visibility</Th>
          <Th>Updated</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id}>
            <Td>
              <Link href={`/admin/projects/${project.id}`} className="font-medium text-ink hover:text-gold-light">{project.name}</Link>
              {project.city && <div className="text-xs text-muted">{project.city}</div>}
            </Td>
            {showCompany && <Td><Link href={`/admin/companies/${project.company.id}`} className="hover:text-gold-light">{project.company.name}</Link></Td>}
            <Td>{project.status}</Td>
            <Td>{project.modelVersion ? <Badge tone="gold"><Box className="size-3" aria-hidden /> Uploaded</Badge> : <Badge tone="warning">Pending</Badge>}</Td>
            <Td>{project.published ? <Badge tone="success">Visible</Badge> : <Badge>Hidden</Badge>}</Td>
            <Td>{formatDate(project.updatedAt)}</Td>
            <Td>
              <div className="flex items-center justify-end gap-1">
                <Link href={`/admin/projects/${project.id}#model`} className={buttonClass(project.modelVersion ? "secondary" : "primary", "sm")}>
                  <Upload className="size-3.5" aria-hidden />
                  {project.modelVersion ? "Manage 3D" : "Add 3D model"}
                </Link>
                <Link href={`/admin/projects/${project.id}#details`} aria-label={`Edit ${project.name}`} title="Edit" className={buttonClass("ghost", "sm")}>
                  <Pencil className="size-3.5" aria-hidden />
                </Link>
                <ProjectActions id={project.id} name={project.name} published={project.published} compact />
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
