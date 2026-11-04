import type { Company, Project, User } from "@prisma/client";
import { createWalkthroughToken } from "./walkthrough-token";

export async function walkthroughSrc(user: User, project: Project) {
  const token = await createWalkthroughToken(user, project);
  const entry = (project.modelEntry ?? "index.html").split("/").map(encodeURIComponent).join("/");
  return `/walkthrough/${token}/${entry}`;
}

export function toPropertyDetails(project: Project & { company: Company }) {
  return {
    name: project.name,
    tagline: project.tagline,
    propertyType: project.propertyType,
    status: project.status,
    city: project.city,
    address: project.address,
    configuration: project.configuration,
    area: project.area,
    priceRange: project.priceRange,
    possession: project.possession,
    reraNumber: project.reraNumber,
    totalFloors: project.totalFloors,
    totalUnits: project.totalUnits,
    amenities: project.amenities,
    description: project.description,
    companyName: project.company.name,
  };
}
