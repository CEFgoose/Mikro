const COLOR_MAP: Record<string, string> = {
  Discussion: "bg-blue-600",
  "OSM Community": "bg-green-600",
  Event: "bg-purple-600",
  University: "bg-indigo-600",
  "1:1 Interaction": "bg-orange-600",
  "New User": "bg-teal-600",
};

export function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${COLOR_MAP[label] || "bg-gray-600"}`}
    >
      {label}
    </span>
  );
}
