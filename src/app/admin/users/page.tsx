import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { addAccount, setAccountRole } from "@/app/admin/users/actions";
import { listAccounts, listPendingGrants, type Account } from "@/lib/admin-data";
import { ROLES, getViewer, type Role } from "@/lib/role";
import { Badge, Card, Note } from "@/components/ui";

export const metadata = { title: "Accounts" };

const input = "rounded-lg border border-line bg-card px-3 py-2 text-sm";
const primary = "rounded-lg bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green-strong";
const secondary = "rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium hover:bg-bg";

const ROLE_LABEL: Record<Role, string> = { student: "Student", instructor: "Instructor", admin: "Admin" };

function tone(role: Role): "neutral" | "green" | "note" {
  if (role === "admin") return "green";
  if (role === "instructor") return "note";
  return "neutral";
}

function when(iso: string): string {
  return iso.slice(0, 10);
}

/** One account. The viewer's own row has no control: an admin cannot change their own role. */
function AccountRow({ account, self }: { account: Account; self: boolean }) {
  const id = `role-${account.user_id}`;
  return (
    <tr className="border-t border-line">
      <td className="px-3 py-2 align-middle">
        <span className="font-medium">{account.email}</span>
        {self && <span className="ml-1.5 text-xs text-muted">(you)</span>}
      </td>
      <td className="px-3 py-2 align-middle text-muted">{account.name ?? ""}</td>
      <td className="px-3 py-2 align-middle">
        <Badge tone={tone(account.role)}>{ROLE_LABEL[account.role]}</Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-2 align-middle tabular-nums text-muted">{when(account.created_at)}</td>
      <td className="px-3 py-2 align-middle">
        {self ? (
          <span className="text-xs text-muted">Ask another admin to change yours.</span>
        ) : (
          <form action={setAccountRole} className="flex items-center gap-2">
            <input type="hidden" name="user" value={account.user_id} />
            <label htmlFor={id} className="sr-only">
              New role for {account.email}
            </label>
            <select id={id} name="role" defaultValue={account.role} className={input}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <button type="submit" className={secondary}>
              Save
            </button>
          </form>
        )}
      </td>
    </tr>
  );
}

async function AccountsContent({ searchParams }: Pick<PageProps<"/admin/users">, "searchParams">) {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/sign-in?next=/admin/users");
  if (viewer.role !== "admin") redirect("/");

  const params = await searchParams;
  const added = typeof params.added === "string" ? params.added : "";
  const saved = typeof params.saved === "string" ? params.saved : "";
  const error = typeof params.error === "string" ? params.error : "";
  const errorEmail = typeof params.email === "string" ? params.email : "";

  const [accounts, pending] = await Promise.all([listAccounts(), listPendingGrants()]);
  const savedRole = accounts.find((a) => a.email === saved)?.role;
  const counts = { admin: 0, instructor: 0, student: 0 } as Record<Role, number>;
  for (const a of accounts) counts[a.role] += 1;

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

      {added && (
        <Note>
          Account made for <span className="font-medium">{added}</span>. Nothing was emailed: tell them to sign in with that address and their role is already set.
        </Note>
      )}
      {saved && (
        <Note>
          Saved. <span className="font-medium">{saved}</span> is now {savedRole ? ROLE_LABEL[savedRole].toLowerCase() : "updated"}.
        </Note>
      )}
      {error === "email" && <Note>That doesn&apos;t look like an email address.</Note>}
      {error === "role" && <Note>Pick a role: student, instructor or admin.</Note>}
      {error === "exists" && (
        <Note>
          <span className="font-medium">{errorEmail || "That address"}</span> already has an account. Change its role in the list below.
        </Note>
      )}
      {error === "self" && <Note>You can&apos;t change your own role. Ask another admin, so there is always one left.</Note>}

      <Card className="space-y-3 p-5">
        <div>
          <h2 className="font-semibold">Add an account</h2>
          <p className="text-sm text-muted">
            For someone who hasn&apos;t signed in yet. No email is sent; they sign in with this address as usual (one-time code, Google or Microsoft) and
            the role is already in place. Anyone can also sign themselves in and start as a student.
          </p>
        </div>
        <form action={addAccount} className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
          <div>
            <label htmlFor="new-email" className="block text-sm font-medium">
              Email
            </label>
            <input id="new-email" name="email" type="email" required autoComplete="off" placeholder="name@school.edu" className={`${input} mt-1 w-full`} />
          </div>
          <div>
            <label htmlFor="new-name" className="block text-sm font-medium">
              Name (optional)
            </label>
            <input id="new-name" name="name" maxLength={120} autoComplete="off" className={`${input} mt-1 w-full`} />
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
        </form>
      </Card>

      <section aria-labelledby="accounts-heading" className="space-y-3">
        <div>
          <h2 id="accounts-heading" className="text-lg font-semibold">
            Everyone <span className="font-normal text-muted">({accounts.length})</span>
          </h2>
          <p className="text-sm text-muted">
            {counts.admin} {counts.admin === 1 ? "admin" : "admins"}, {counts.instructor} {counts.instructor === 1 ? "instructor" : "instructors"},{" "}
            {counts.student} {counts.student === 1 ? "student" : "students"}. Newest first. Pick a role and save; it applies the next time they load a page.
          </p>
        </div>
        {accounts.length === 0 ? (
          <Card className="p-5 text-muted">No accounts yet.</Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Accounts: email, name, role, date joined, and a control to change the role</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Joined
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Change role
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <AccountRow key={a.user_id} account={a} self={a.user_id === viewer.user?.id} />
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {pending.length > 0 && (
        <section aria-labelledby="pending-heading" className="space-y-3">
          <div>
            <h2 id="pending-heading" className="text-lg font-semibold">
              Granted, not signed in yet <span className="font-normal text-muted">({pending.length})</span>
            </h2>
            <p className="text-sm text-muted">
              Addresses given a role ahead of their first sign-in. Each gets that role when it first signs in and then appears above. To set one up now
              instead, add the account above with the same address.
            </p>
          </div>
          <Card>
            <ul className="divide-y divide-line text-sm">
              {pending.map((g) => (
                <li key={g.email} className="flex flex-wrap items-center gap-3 px-3 py-2">
                  <span className="font-medium">{g.email}</span>
                  <Badge tone={tone(g.role)}>{ROLE_LABEL[g.role]}</Badge>
                  {g.note && <span className="text-muted">{g.note}</span>}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}

export default function AccountsPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <AccountsContent searchParams={searchParams} />
    </Suspense>
  );
}
