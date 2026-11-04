import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { splitList } from "@/lib/format";

export type PropertyDetails = {
  name: string;
  tagline: string;
  propertyType: string;
  status: string;
  city: string;
  address: string;
  configuration: string;
  area: string;
  priceRange: string;
  possession: string;
  reraNumber: string;
  totalFloors: string;
  totalUnits: string;
  amenities: string;
  description: string;
  companyName: string;
};

export function PropertyPanel({ property, onClose }: { property: PropertyDetails; onClose: () => void }) {
  const facts = [
    ["Builder", property.companyName],
    ["Property type", property.propertyType],
    ["Configuration", property.configuration],
    ["Area", property.area],
    ["Price range", property.priceRange],
    ["Possession", property.possession],
    ["Total floors", property.totalFloors],
    ["Total units", property.totalUnits],
    ["RERA number", property.reraNumber],
    ["Address", property.address || property.city],
  ].filter(([, value]) => value);
  const amenities = splitList(property.amenities);

  return (
    <aside aria-label="Property details" className="absolute inset-y-0 right-0 z-10 flex w-full max-w-sm flex-col border-l border-line bg-surface shadow-pop">
      <div className="flex items-start justify-between gap-3 border-b border-line p-5">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold leading-tight">{property.name}</h2>
          {property.tagline && <p className="mt-1 text-[13px] text-muted">{property.tagline}</p>}
          <Badge className="mt-3">{property.status}</Badge>
        </div>
        <button type="button" onClick={onClose} aria-label="Close details" className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink">
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {property.description && <p className="text-sm leading-relaxed text-soft">{property.description}</p>}

        <dl className="divide-y divide-line/60 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="shrink-0 text-muted">{label}</dt>
              <dd className="text-right text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {amenities.length > 0 && (
          <div>
            <h3 className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted">Amenities</h3>
            <ul className="flex flex-wrap gap-1.5">
              {amenities.map((amenity) => <li key={amenity}><Badge>{amenity}</Badge></li>)}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
