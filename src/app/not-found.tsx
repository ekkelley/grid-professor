import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-muted">That page doesn&apos;t exist, or it isn&apos;t part of this course.</p>
      <ButtonLink href="/">Back to courses</ButtonLink>
    </div>
  );
}
