"use client";

import type { DashboardSnapshot, ReadinessStatus, TestResult } from "@/src/domain/types";
import { toolCatalog } from "@/src/webmcp/tool-catalog";
import { useWebMcp } from "@/src/webmcp/use-webmcp";
import {
  Activity,
  AlertTriangle,
  Bot,
  Box,
  Bug,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  FileCheck2,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  TestTube2,
  Unplug,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type View = "dashboard" | "requirements" | "tests" | "executions" | "defects" | "readiness";

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "requirements", label: "Requirements", icon: FileCheck2 },
  { id: "tests", label: "Test Cases", icon: FlaskConical },
  { id: "executions", label: "Executions", icon: Play },
  { id: "defects", label: "Defects", icon: Bug },
  { id: "readiness", label: "Release Readiness", icon: Gauge },
];

const viewDescriptions: Record<View, { eyebrow: string; title: string; subtitle: string }> = {
  dashboard: { eyebrow: "MISSION CONTROL", title: "Release command center", subtitle: "Live quality signals for Checkout Reliability 2.4" },
  requirements: { eyebrow: "TRACEABILITY", title: "Requirements", subtitle: "Acceptance criteria and their verified test coverage" },
  tests: { eyebrow: "TEST INVENTORY", title: "Test cases", subtitle: "Human and agent-authored validation scenarios" },
  executions: { eyebrow: "RUN HISTORY", title: "Executions", subtitle: "Deterministic results with inspectable evidence" },
  defects: { eyebrow: "RISK REGISTER", title: "Defects", subtitle: "Release-blocking findings linked to their evidence" },
  readiness: { eyebrow: "GO / NO-GO", title: "Release readiness", subtitle: "An explainable recommendation derived from live QA state" },
};

async function getSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch("/api/state", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load TestPilot state.");
  const result = (await response.json()) as { success: true; data: DashboardSnapshot };
  return result.data;
}

function statusTone(value: string) {
  if (["PASS", "COVERED", "READY", "ACTIVE"].includes(value)) return "success";
  if (["FAIL", "CRITICAL", "NOT READY", "MISSING COVERAGE"].includes(value.toUpperCase())) return "danger";
  if (["AT RISK", "HIGH"].includes(value.toUpperCase())) return "warning";
  return "neutral";
}

function StatusPill({ value, dot = true }: { value: string; dot?: boolean }) {
  return (
    <span className={`status-pill ${statusTone(value)}`}>
      {dot && <span className="status-dot" />}
      {value}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "teal" | "violet" | "blue" | "red" | "amber";
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={19} strokeWidth={2} /></div>
      <div className="metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function SectionHeader({ title, meta, children }: { title: string; meta?: string; children?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {meta && <p>{meta}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="empty-state">
      <span><Icon size={22} /></span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function ExecutionResult({ result }: { result: TestResult }) {
  return result === "PASS" ? (
    <span className="result-label pass"><CheckCircle2 size={15} /> PASS</span>
  ) : (
    <span className="result-label fail"><XCircle size={15} /> FAIL</span>
  );
}

function ReadinessSeal({ status }: { status: ReadinessStatus }) {
  const Icon = status === "READY" ? ShieldCheck : status === "NOT READY" ? ShieldAlert : AlertTriangle;
  return (
    <div className={`readiness-seal ${statusTone(status)}`}>
      <Icon size={28} />
      <div><small>RELEASE 2.4</small><strong>{status}</strong></div>
    </div>
  );
}

function DashboardView({ data, onNavigate }: { data: DashboardSnapshot; onNavigate: (view: View) => void }) {
  const latest = data.executions[0];
  const gap = data.requirements.find((requirement) => requirement.coverage_status === "MISSING COVERAGE");
  return (
    <div className="view-stack">
      <section className={`release-banner ${statusTone(data.assessment.status)}`}>
        <div className="release-signal">
          <ReadinessSeal status={data.assessment.status} />
          <div className="release-message">
            <div className="banner-kicker"><Activity size={14} /> LIVE ASSESSMENT · REVISION {data.revision}</div>
            <h2>{data.assessment.reason}</h2>
            <p>{data.assessment.reasoning[0]}</p>
          </div>
        </div>
        <button className="banner-action" onClick={() => onNavigate("readiness")}>Review rationale <ChevronRight size={16} /></button>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Release" value="v2.4" detail="Candidate · Checkout Reliability" icon={Box} tone="blue" />
        <MetricCard label="Requirements covered" value={`${data.metrics.requirements_covered}/${data.metrics.requirements_total}`} detail={`${data.metrics.coverage_percent}% coverage`} icon={ClipboardCheck} tone="violet" />
        <MetricCard label="Latest pass rate" value={`${data.metrics.pass_rate}%`} detail={`${data.metrics.tests_passed} of ${data.metrics.tests_total} tests passing`} icon={Gauge} tone="teal" />
        <MetricCard label="Critical defects" value={String(data.metrics.open_critical_defects)} detail="Open release blockers" icon={Bug} tone={data.metrics.open_critical_defects ? "red" : "teal"} />
        <MetricCard label="Latest execution" value={latest?.id ?? "—"} detail={latest ? `${latest.test_case_id} · ${latest.result}` : "No executions"} icon={Activity} tone={latest?.result === "FAIL" ? "red" : "amber"} />
      </section>

      <section className="dashboard-columns">
        <article className="panel mission-panel">
          <SectionHeader title="Agent mission" meta="Structured actions, visible consequences">
            <span className="live-chip"><span /> WEBMCP LIVE</span>
          </SectionHeader>
          <div className="mission-flow">
            {[
              { icon: Search, label: "Discover gap", detail: gap ? gap.id : "Complete", active: Boolean(gap) },
              { icon: TestTube2, label: "Create test", detail: data.test_cases.some((test) => test.id === "TC-004") ? "TC-004 added" : "Awaiting agent", active: data.test_cases.some((test) => test.id === "TC-004") },
              { icon: Play, label: "Execute", detail: data.executions.some((item) => item.test_case_id === "TC-004") ? "Race exposed" : "Not run", active: data.executions.some((item) => item.test_case_id === "TC-004") },
              { icon: Bug, label: "Raise defect", detail: data.defects[0]?.id ?? "Pending evidence", active: data.defects.length > 0 },
            ].map((step, index) => (
              <div className="mission-step-wrap" key={step.label}>
                <div className={`mission-step ${step.active ? "active" : ""}`}>
                  <span className="step-index">0{index + 1}</span>
                  <step.icon size={18} />
                  <div><strong>{step.label}</strong><small>{step.detail}</small></div>
                </div>
                {index < 3 && <ChevronRight className="step-arrow" size={17} />}
              </div>
            ))}
          </div>
          <div className="invariant-card">
            <div className="invariant-icon"><ShieldCheck size={21} /></div>
            <div>
              <span>CORE SAFETY INVARIANT</span>
              <strong>inventory ≥ 0</strong>
              <p>A customer must never purchase more inventory than is currently available.</p>
            </div>
          </div>
        </article>

        <article className="panel activity-panel">
          <SectionHeader title="Agent activity" meta="Changes appear here instantly" />
          {data.activity.length ? (
            <div className="activity-list">
              {data.activity.slice(0, 5).map((event) => (
                <div className="activity-row" key={event.id}>
                  <span className={`activity-marker ${event.kind.toLowerCase()}`}><Bot size={14} /></span>
                  <div><strong>{event.title}</strong><p>{event.detail}</p><small>{formatTime(event.created_at)} · {event.actor}</small></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Bot} title="Waiting for the agent" body="Ask the demo question to begin the release investigation." />
          )}
        </article>
      </section>

      <section className="panel">
        <SectionHeader title="Requirement pulse" meta="Release 2.4 coverage at a glance">
          <button className="text-button" onClick={() => onNavigate("requirements")}>View all <ChevronRight size={15} /></button>
        </SectionHeader>
        <div className="requirement-cards">
          {data.requirements.map((requirement) => (
            <article className={`requirement-mini ${requirement.coverage_status === "MISSING COVERAGE" ? "gap" : ""}`} key={requirement.id}>
              <div><code>{requirement.id}</code><StatusPill value={requirement.coverage_status} /></div>
              <h3>{requirement.title}</h3>
              <p>{requirement.description}</p>
              <small>{requirement.linked_test_cases.length ? requirement.linked_test_cases.join(" · ") : "No linked tests"}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function RequirementsView({ data }: { data: DashboardSnapshot }) {
  return (
    <section className="panel table-panel">
      <SectionHeader title="Release requirements" meta={`${data.metrics.requirements_covered} of ${data.metrics.requirements_total} covered`}>
        <div className="coverage-meter"><span style={{ width: `${data.metrics.coverage_percent}%` }} /></div>
      </SectionHeader>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Requirement</th><th>Priority</th><th>Coverage</th><th>Linked tests</th></tr></thead>
          <tbody>
            {data.requirements.map((requirement) => (
              <tr key={requirement.id} className={requirement.coverage_status === "MISSING COVERAGE" ? "attention-row" : ""}>
                <td><div className="primary-cell"><code>{requirement.id}</code><div><strong>{requirement.title}</strong><p>{requirement.description}</p></div></div></td>
                <td><StatusPill value={requirement.priority} /></td>
                <td><StatusPill value={requirement.coverage_status} /></td>
                <td>{requirement.linked_test_cases.length ? <div className="id-stack">{requirement.linked_test_cases.map((id) => <code key={id}>{id}</code>)}</div> : <span className="missing-copy"><AlertTriangle size={15} /> Agent action needed</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.requirements.some((requirement) => requirement.coverage_status === "MISSING COVERAGE") && (
        <div className="callout warning-callout"><Sparkles size={18} /><div><strong>Coverage intelligence</strong><p>REQ-003 has no validating scenario. The agent can discover it through <code>get_coverage_gaps</code> and create the missing concurrency test without navigating this table.</p></div></div>
      )}
    </section>
  );
}

function TestsView({ data }: { data: DashboardSnapshot }) {
  return (
    <section className="panel table-panel">
      <SectionHeader title="Test case inventory" meta={`${data.test_cases.length} active scenarios`}>
        <div className="legend"><span><i className="human-dot" /> Human</span><span><i className="agent-dot" /> AI Agent</span></div>
      </SectionHeader>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Test case</th><th>Requirement</th><th>Created by</th><th>Status</th><th>Latest result</th></tr></thead>
          <tbody>
            {data.test_cases.map((test) => (
              <tr key={test.id} className={test.created_by === "AI Agent" ? "agent-row" : ""}>
                <td><div className="primary-cell"><code>{test.id}</code><div><strong>{test.title}</strong><p>{test.description}</p></div></div></td>
                <td><code>{test.requirement_id}</code></td>
                <td><span className={`creator-badge ${test.created_by === "AI Agent" ? "agent" : "human"}`}>{test.created_by === "AI Agent" ? <Bot size={14} /> : <CircleDot size={13} />}{test.created_by}</span></td>
                <td><StatusPill value={test.status} /></td>
                <td>{test.last_execution_result === "NOT RUN" ? <span className="muted">NOT RUN</span> : <ExecutionResult result={test.last_execution_result} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExecutionsView({ data }: { data: DashboardSnapshot }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <section className="panel table-panel">
      <SectionHeader title="Execution history" meta="Newest results first">
        <span className="deterministic-chip"><Check size={13} /> DETERMINISTIC SIMULATION</span>
      </SectionHeader>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Execution</th><th>Test</th><th>Timestamp</th><th>Result</th><th>Duration</th><th>Evidence</th></tr></thead>
          <tbody>
            {data.executions.map((execution) => (
              <tr key={execution.id} className={execution.result === "FAIL" ? "failure-row" : ""}>
                <td><code>{execution.id}</code></td>
                <td><code>{execution.test_case_id}</code></td>
                <td className="muted-cell">{formatDate(execution.executed_at)}</td>
                <td><ExecutionResult result={execution.result} /></td>
                <td><span className="mono-value">{execution.duration_ms} ms</span></td>
                <td><button className="evidence-button" onClick={() => setExpanded(expanded === execution.id ? null : execution.id)}>{expanded === execution.id ? "Hide" : "Inspect"} <TerminalSquare size={14} /></button>{expanded === execution.id && <pre className="evidence-popover">{JSON.stringify(execution.evidence, null, 2)}</pre>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DefectsView({ data }: { data: DashboardSnapshot }) {
  return (
    <div className="view-stack">
      {data.defects.length ? data.defects.map((defect) => (
        <article className="panel defect-card" key={defect.id}>
          <div className="defect-header">
            <div className="defect-icon"><Bug size={22} /></div>
            <div><div className="defect-id-line"><code>{defect.id}</code><StatusPill value={defect.severity.toUpperCase()} /><StatusPill value={defect.status} /></div><h2>{defect.title}</h2><p>{defect.description}</p></div>
          </div>
          <div className="defect-grid">
            <div><span>LINKED TEST</span><strong>{defect.test_case_id ?? "Awaiting link"}</strong></div>
            <div><span>EXECUTION</span><strong>{defect.execution_id ?? "—"}</strong></div>
            <div><span>CREATED BY</span><strong className="with-icon"><Bot size={15} /> {defect.created_by}</strong></div>
            <div><span>CREATED</span><strong>{formatDate(defect.created_at)}</strong></div>
          </div>
          <div className="evidence-block"><div><TerminalSquare size={16} /><strong>Structured evidence</strong></div><pre>{JSON.stringify(defect.evidence, null, 2)}</pre></div>
        </article>
      )) : (
        <section className="panel"><EmptyState icon={ShieldCheck} title="No open defects" body="The release looks clean on known evidence. Agent-driven coverage analysis may reveal hidden risk." /></section>
      )}
    </div>
  );
}

function ReadinessView({ data }: { data: DashboardSnapshot }) {
  return (
    <div className="readiness-layout">
      <section className={`panel readiness-hero ${statusTone(data.assessment.status)}`}>
        <div className="readiness-orbit"><div className="orbit-ring"><div className="orbit-core">{data.assessment.status === "NOT READY" ? <ShieldAlert size={48} /> : data.assessment.status === "READY" ? <ShieldCheck size={48} /> : <AlertTriangle size={48} />}</div></div></div>
        <span>RELEASE RECOMMENDATION</span>
        <h2>{data.assessment.status}</h2>
        <p>{data.assessment.reason}</p>
        <small>Computed from live application state · revision {data.revision}</small>
      </section>
      <section className="panel rationale-panel">
        <SectionHeader title="Assessment rationale" meta="Every recommendation is explainable" />
        <div className="rationale-list">
          {data.assessment.reasoning.map((reason, index) => (
            <div key={reason}><span>{index + 1}</span><p>{reason}</p></div>
          ))}
        </div>
        <div className="divider" />
        <SectionHeader title="Blocking signals" meta={`${data.assessment.blockers.length} signal${data.assessment.blockers.length === 1 ? "" : "s"}`} />
        <div className="blocker-list">
          {data.assessment.blockers.length ? data.assessment.blockers.map((blocker) => (
            <div className={`blocker ${blocker.type.toLowerCase()}`} key={`${blocker.type}-${blocker.id}`}><AlertTriangle size={17} /><div><code>{blocker.id}</code><strong>{blocker.summary}</strong><small>{blocker.type.replaceAll("_", " ")}</small></div></div>
          )) : <div className="clear-signal"><ShieldCheck size={18} /> No release blockers detected.</div>}
        </div>
      </section>
      <section className="panel trace-panel">
        <SectionHeader title="Decision trace" meta="One shared state for humans and agents" />
        <div className="trace-chain">
          <div><FileCheck2 size={18} /><span>Requirement</span><strong>REQ-003</strong></div><ChevronRight size={17} />
          <div><FlaskConical size={18} /><span>Test</span><strong>{data.test_cases.some((test) => test.id === "TC-004") ? "TC-004" : "Gap"}</strong></div><ChevronRight size={17} />
          <div><Activity size={18} /><span>Execution</span><strong>{data.executions.find((item) => item.test_case_id === "TC-004")?.id ?? "Pending"}</strong></div><ChevronRight size={17} />
          <div><Bug size={18} /><span>Defect</span><strong>{data.defects[0]?.id ?? "Pending"}</strong></div>
        </div>
      </section>
    </div>
  );
}

export function TestPilotApp() {
  const [view, setView] = useState<View>("dashboard");
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const webMcp = useWebMcp();

  const refresh = useCallback(async () => {
    try {
      const next = await getSnapshot();
      setData((current) => current?.revision === next.revision ? current : next);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "TestPilot state is unavailable.");
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), 1500);
    const immediateRefresh = () => void refresh();
    window.addEventListener("testpilot:state-changed", immediateRefresh);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("testpilot:state-changed", immediateRefresh);
    };
  }, [refresh]);

  const activeInfo = viewDescriptions[view];
  const toolStatus = useMemo(() => {
    if (webMcp.supported === null) return { label: "Detecting WebMCP", className: "checking", icon: LoaderCircle };
    if (webMcp.error) return { label: "Registration error", className: "error", icon: AlertTriangle };
    if (!webMcp.supported) return { label: "Preview mode", className: "preview", icon: Unplug };
    return { label: `${webMcp.registered} agent tools live`, className: "connected", icon: Bot };
  }, [webMcp]);

  async function resetDemo() {
    if (!window.confirm("Reset TestPilot to the initial demo state? TC-004 and all agent-created defects and executions will be removed.")) return;
    setResetting(true);
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (!response.ok) throw new Error("Reset failed.");
      await refresh();
      setView("dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reset failed.");
    } finally {
      setResetting(false);
    }
  }

  const content = data ? {
    dashboard: <DashboardView data={data} onNavigate={setView} />,
    requirements: <RequirementsView data={data} />,
    tests: <TestsView data={data} />,
    executions: <ExecutionsView data={data} />,
    defects: <DefectsView data={data} />,
    readiness: <ReadinessView data={data} />,
  }[view] : null;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><TestTube2 size={22} /><span /></div>
          <div><strong>TestPilot</strong><small>QA MISSION CONTROL</small></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {navItems.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setMobileNav(false); }}>
              <item.icon size={18} /><span>{item.label}</span>
              {item.id === "defects" && data && data.metrics.open_critical_defects > 0 && <b>{data.metrics.open_critical_defects}</b>}
              {view === item.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="demo-card">
          <div className="demo-card-title"><Sparkles size={15} /><span>DEMO SCENARIO</span></div>
          <p>Ask your AI agent:</p>
          <blockquote>“Check whether version 2.4 is safe to release.”</blockquote>
          <div className="demo-card-footer"><Bot size={14} /><span>{toolCatalog.length} semantic actions exposed</span></div>
        </div>
        <div className="sidebar-footer"><div className="avatar">TP</div><div><strong>Checkout Reliability</strong><span>Release 2.4 · Candidate</span></div><CircleDot size={12} /></div>
      </aside>

      {mobileNav && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}

      <main>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}><ListChecks size={21} /></button>
          <div className="breadcrumb"><span>TestPilot</span><ChevronRight size={14} /><strong>{navItems.find((item) => item.id === view)?.label}</strong></div>
          <div className="topbar-actions">
            <div className={`tool-status ${toolStatus.className}`} title={webMcp.error ?? undefined}><toolStatus.icon size={15} /><span>{toolStatus.label}</span></div>
            <button className="icon-button" aria-label="Refresh state" onClick={() => void refresh()}><RefreshCcw size={17} /></button>
            <button className="reset-button" onClick={() => void resetDemo()} disabled={resetting}>{resetting ? <LoaderCircle className="spin" size={16} /> : <RotateCcw size={16} />} Reset Demo</button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-title-row">
            <div><span>{activeInfo.eyebrow}</span><h1>{activeInfo.title}</h1><p>{activeInfo.subtitle}</p></div>
            <div className="release-chip"><span className="pulse-dot" /><div><small>ACTIVE RELEASE</small><strong>v2.4</strong></div></div>
          </div>
          {error && <div className="error-banner"><AlertTriangle size={17} /><span>{error}</span><button onClick={() => void refresh()}>Retry</button></div>}
          {!data && !error && <div className="loading-state"><LoaderCircle className="spin" size={26} /><span>Initializing mission control…</span></div>}
          {content}
        </div>
      </main>
    </div>
  );
}
