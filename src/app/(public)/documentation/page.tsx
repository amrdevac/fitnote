"use client";

import React, { useMemo, useState } from "react";
import ThemeSwitcher from "@/components/feature/themeSwitch";
import Modal from "@/components/shared/Modal";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { Button } from "ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "ui/accordion";
import BasicInput from "@/lib/BasicInput";
import { useModal } from "@/hooks/useModal";
import { useConfirm } from "@/hooks/useConfirm";
import { useServerRunner } from "@/lib/useServerRuner";
import { Marquee } from "@/components/magicui/marquee";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="text-xs md:text-sm bg-slate-900 text-green-200 p-4 rounded-md overflow-x-auto">
      <code>{code}</code>
    </pre>
  );
}

function ModalDemo() {
  const modal = useModal();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared/Modal + useModal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={() => modal.open()}>Open Modal</Button>
        <Modal
          isOpen={modal.isOpen}
          onClose={modal.close}
          title="Example Modal"
        >
          <p>This is a simple modal content. Close me with ESC or button.</p>
        </Modal>
        <CodeBlock
          code={`import Modal from "@/components/shared/Modal";
import { useModal } from "@/hooks/useModal";

const Demo = () => {
  const modal = useModal();
  return (
    <>
      <button onClick={() => modal.open()}>Open</button>
      <Modal isOpen={modal.isOpen} onClose={modal.close} title="Hello">
        Content here
      </Modal>
    </>
  );
};`}
        />
      </CardContent>
    </Card>
  );
}

function ConfirmDemo() {
  const { confirm, openConfirm, closeConfirm } = useConfirm();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared/ConfirmModal + useConfirm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() =>
            openConfirm({
              title: "Delete Item",
              message: "Are you sure want to delete?",
              confirmText: "Yes",
              onConfirm: async () => alert("Confirmed!"),
            })
          }
        >
          Open Confirm
        </Button>

        <ConfirmModal
          isOpen={!!confirm.isOpen}
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          onConfirm={confirm.onConfirm || (() => {})}
          onCancel={closeConfirm}
        />

        <CodeBlock
          code={`import ConfirmModal from "@/components/shared/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";

const Demo = () => {
  const { confirm, openConfirm, closeConfirm } = useConfirm();
  return (
    <>
      <button onClick={() => openConfirm({
        title: 'Delete',
        message: 'Proceed?',
        onConfirm: async () => {...},
        onCancel: closeConfirm,
      })}>Ask</button>
      <ConfirmModal
        isOpen={!!confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm!}
        onCancel={closeConfirm}
      />
    </>
  )
};`}
        />
      </CardContent>
    </Card>
  );
}

function ThemeDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature/ThemeSwitcher</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ThemeSwitcher />
        <CodeBlock
          code={`import ThemeSwitcher from "@/components/feature/themeSwitch";

<ThemeSwitcher onChange={(th) => console.log(th)} />`}
        />
      </CardContent>
    </Card>
  );
}

function MarqueeDemo() {
  const items = useMemo(
    () => ["React", "Next.js", "Shadcn", "Tailwind", "libsql", "Axios"],
    []
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>MagicUI/Marquee</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="border rounded-md overflow-hidden">
          <Marquee pauseOnHover className="bg-slate-50">
            {items.map((it) => (
              <div key={it} className="px-6 py-2 text-sm">
                {it}
              </div>
            ))}
          </Marquee>
        </div>
        <CodeBlock
          code={`import Marquee from "@/components/magicui/marquee";

<Marquee pauseOnHover>
  {["A","B","C"].map((t) => <div key={t}>{t}</div>)}
</Marquee>`}
        />
      </CardContent>
    </Card>
  );
}

function UiComponentsDemo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>UI Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-x-2">
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <CodeBlock
          code={`import { Button } from "ui/button";

<Button>Default</Button>`}
        />

        <Card className="border">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content...</CardContent>
        </Card>
        <CodeBlock
          code={`import { Card, CardHeader, CardTitle, CardContent } from "ui/card";`}
        />

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is this?</AccordionTrigger>
            <AccordionContent>A ready-to-use accordion.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <CodeBlock
          code={`import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "ui/accordion";`}
        />
      </CardContent>
    </Card>
  );
}

function BasicInputDemo() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    bio: "",
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lib/BasicInput</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BasicInput
            type="text"
            name="name"
            label="Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            validationRule="required|minChar:3"
          />
          <BasicInput
            type="email"
            name="email"
            label="Email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            validationRule="required|email"
          />
          <BasicInput
            type="select"
            name="role"
            label="Role"
            value={form.role}
            options={[
              { label: "Admin", value: "admin" },
              { label: "User", value: "user" },
            ]}
            onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
            validationRule="required"
          />
          <div className="md:col-span-2">
            <BasicInput
              type="textarea"
              name="bio"
              label="Bio (Editor.js)"
              value={form.bio}
              onChange={(e) =>
                setForm((s) => ({ ...s, bio: e.target.value }))
              }
              validationRule="required"
            />
          </div>
        </div>
        {/* preview removed as requested */}
        <CodeBlock
          code={`import BasicInput from "@/lib/BasicInput";

const [form, setForm] = useState({ name: "", email: "" });
<BasicInput type="text" name="name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />`}
        />
      </CardContent>
    </Card>
  );
}

function HttpRequestSnippet() {
  const code = `import { httpRequest } from "@/lib/httpRequest";

// Internal API example (Next.js route handlers)
const services = await httpRequest().internal("services").get();

// External API example
const users = await httpRequest()
  .baseUrl("https://api.example.com")
  .api("/users")
  .headers({ Authorization: "Bearer token" })
  .get();`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lib/httpRequest</CardTitle>
      </CardHeader>
      <CardContent>
        <CodeBlock code={code} />
      </CardContent>
    </Card>
  );
}

function ServiceHookSnippet() {
  const code = `import useService from "@/hooks/useService";

const { getServices, createService, updateService, deleteService } = useService();

// In a component
if (getServices.isLoading) return <div>Loading...</div>;
return (
  <ul>
    {getServices.data?.map(s => <li key={s.id}>{s.title}</li>)}
  </ul>
);`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hook/useService</CardTitle>
      </CardHeader>
      <CardContent>
        <CodeBlock code={code} />
      </CardContent>
    </Card>
  );
}

function CompanyInfoHookSnippet() {
  const code = `import useCompanyInfo from "@/hooks/useCompanyInfo";

const { getData } = useCompanyInfo();
// getData.data -> axios response
// getData.isLoading, getData.error`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hook/useCompanyInfo</CardTitle>
      </CardHeader>
      <CardContent>
        <CodeBlock code={code} />
      </CardContent>
    </Card>
  );
}

function ServerRunnerDemo() {
  const fakeServerFn = async (name: string) => {
    await new Promise((r) => setTimeout(r, 800));
    return `Hello, ${name}!`;
  };
  const { run, isLoading, isError, isSuccess } = useServerRunner(fakeServerFn);
  const [out, setOut] = useState<string | undefined>();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lib/useServerRunner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={async () => {
            const res = await run("Docs");
            setOut(res as any);
          }}
          disabled={isLoading}
        >
          {isLoading ? "Running..." : "Run async"}
        </Button>
        <div className="text-sm">
          Status:{" "}
          {isLoading
            ? "loading"
            : isError
            ? "error"
            : isSuccess
            ? "success"
            : "idle"}
        </div>
        {out && <div className="text-sm">Result: {out}</div>}
        <CodeBlock
          code={`import { useServerRunner } from "@/lib/useServerRuner";

const { run, isLoading, isError, isSuccess } = useServerRunner(serverAction);
await run(arg1, arg2);`}
        />
      </CardContent>
    </Card>
  );
}

export default function DocumentationPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-40 py-10 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Documentation</h1>
        <p className="text-slate-600 max-w-2xl">
          Katalog komponen, hooks, dan library yang tersedia, dilengkapi contoh
          pemakaian (kode dan hasilnya).
        </p>
      </header>

      <Section title="Components">
        <UiComponentsDemo />
        <ThemeDemo />
        <MarqueeDemo />
        <ModalDemo />
        <ConfirmDemo />
        <Card>
          <CardHeader>
            <CardTitle>Providers (snippet)</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock
              code={`// Progress bar provider (wrap in root layout)
import ProgressBarProviders from "@/components/providers/ProgressBar";

// Diary session provider (handle PIN + blur state)
import DiarySessionProvider from "@/components/providers/DiarySessionProvider";`}
            />
          </CardContent>
        </Card>
      </Section>

      <Section title="Hooks">
        <ServiceHookSnippet />
        <CompanyInfoHookSnippet />
      </Section>

      <Section title="Libraries">
        <BasicInputDemo />
        <HttpRequestSnippet />
        <ServerRunnerDemo />
        <Card>
          <CardHeader>
            <CardTitle>Lib/debug (dd)</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock code={`import { dd } from "@/lib/debug";\n{dd(data)}`} />
          </CardContent>
        </Card>
      </Section>
    </main>
  );
}
