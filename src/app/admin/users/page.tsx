import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addAccount, setAccountRole, setGrantRole } from "@/app/admin/users/actions";
import { listPeople, type Person } from "@/lib/admin-data";
import { ROLES, getViewer, type Role } from "@/lib/role";
import { ActionForm } from "@/components/action-form";
import { Badge, Card } from "@/components/ui";

export const metadata = { title: "Accounts" };

const input = "rounded-lg border border-line bg-card px-3 py-2 text-sm";
const primary = "rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong";
const quiet = "rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium hover:bg-bg";

const ROLE_LABEL: Record<Role, string> = { student: "Student", instructor: "Instructor", admin: "Admin" };

function tone(role: Role): "neutral" | "green" | "note" {
  if (role === "admin") return "green";
  if (role === "instructor") return "note";
  return "neutral";
}

/** One person: an account, or a grant waiting for its first sign-in. The viewer's own row has no controls. */
function PersonRow({ person, self }: { person: Person; self: boolean }) {
  const pending = person.userId === null;
  const others = ROLES.filter((r) => r !== person.role);
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="font-semibold">{person.name ?? person.email}</strong>
          <Badge tone={tone(person.role)}>{ROLE_LABEL[person.role]}</Badge>
          {pending && <Badge>Not signed in yet</Badge>}
          {self && <span className="text-xs text-muted">(you)</span>}
        </div>
        <p className="text-sm text-muted">
          {person.email}
          {person.joined && <>, joined {person.joined.slice(0, 10)}</>}
          {person.note && <>. {person.note}</>}
        </p>
      </div>
      {!self && (
        <ActionForm action={pending ? setGrantRole : setAccountRole} className="flex flex-wrap items-center gap-2">
          {pending ? <input type="hidden" name="email" value={person.email} /> : <input type="hidden" name="user" value={person.userId ?? ""} />}
          {others.map((r) => (
            <button key={r} type="submit" name="role" value={r} className={quiet}>
              Make {ROLE_LABEL[r].toLowerCase()}
              <span className="sr-only">: {person.email}</span>
            </button>
          ))}
        </ActionForm>
      )}
    </li>
  );
}

async function AccountsContent() {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/sign-in?next=/admin/users");
  if (viewer.role !== "admin") redirect("/");

  const people = await listPeople();
  const counts = { admin: 0, instructor: 0, student: 0 } as Record<Role, number>;
  let pending = 0;
  for (const p of people) {
    if (p.userId === null) pending += 1;
    else counts[p.role] += 1;
  }
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <div className="space-y-8">
      <div className="max-w-prose">
        <p className="text-sm text-muted">
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="mt-1 text-muted">
          Everyone with a Grid Professor account and what they can do. Students take courses. Instructors also start courses from templates and request
          cases. Admins also build cases and manage accounts.
        </p>
      </div>

      <section aria-labelledby="people-heading" className="space-y-3">
        <div>
          <h2 id="people-heading" className="text-lg font-semibold">
            Everyone <span className="font-normal text-muted">({people.length})</span>
          </h2>
          <p className="text-sm text-muted">
            {plural(counts.admin, "admin", "admins")}, {plural(counts.instructor, "instructor", "instructors")}, {plural(counts.student, "student", "students")}
            {pending > 0 && <>, and {plural(pending, "address", "addresses")} added but not signed in yet</>}. A change applies the next time they load a page.
          </p>
        </div>
        {people.length === 0 ? (
          <Card className="p-5 text-muted">Nobody yet. Add an account below, or anyone can sign in and start as a student.</Card>
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {people.map((p) => (
                <PersonRow key={p.userId ?? p.email} person={p} self={p.userId !== null && p.userId === viewer.user?.id} />
              ))}
            </ul>
          </Card>
        )}
      </section>

      <Card className="space-y-3 p-5">
        <div>
          <h2 className="font-semibold">Add an account</h2>
          <p className="text-sm text-muted">
            An allowlist entry. Nothing is emailed: the person signs in with this address as usual (one-time code, Google or Microsoft) and gets this
            role the first time they do. An address that already has an account is changed in place.
          </p>
        </div>
        <ActionForm action={addAccount} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
            <div>
              <label htmlFor="new-name" className="block text-sm font-medium">
                Name (optional)
              </label>
              <input id="new-name" name="name" maxLength={120} autoComplete="off" className={`${input} mt-1 w-full`} />
            </div>
            <div>
              <label htmlFor="new-email" className="block text-sm font-medium">
                Email
              </label>
              <input id="new-email" name="email" type="email" required autoComplete="off" placeholder="name@school.edu" className={`${input} mt-1 w-full`} />
            </div>
            <div>
              <label htmlFor="new-role" className="block text-sm font-medium">
                Role
              </label>
              <select id="new-role" name="role" defaultValue="student" className={`${input} mt-1 w-full`}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={primary}>
              Add account
            </button>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <AccountsContent />
    </Suspense>
  );
}
