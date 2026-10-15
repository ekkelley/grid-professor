import { Card } from "@/components/ui";

export default function Grades() {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Grades</h2>
      <p className="mt-2 max-w-prose text-muted">
        Grades come from the Grid Professor add-in, which grades each workbook live as you work. This page will show what&apos;s
        due, what you&apos;ve attempted and your scores once the add-in&apos;s connection is in place.
      </p>
    </Card>
  );
}
