import { Shield, Lock, Key, Eye, AlertTriangle, CheckCircle2, Users, Server, Database, Globe, FileText, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const ISOLATION_LAYERS = [
  { layer: "Authentication", mechanism: "JWT + RS256 signing", protects: "Unauthorized access", icon: Key },
  { layer: "API Middleware", mechanism: "company_id injection", protects: "Missing filters in code", icon: Server },
  { layer: "Database RLS", mechanism: "PostgreSQL policies", protects: "SQL bugs, direct DB access", icon: Database },
  { layer: "Storage Layer", mechanism: "Tenant-prefixed paths", protects: "File/blob cross-access", icon: Globe },
  { layer: "Audit Logs", mechanism: "Immutable access logs", protects: "Insider threats, compliance", icon: FileText },
];

const RBAC_ROLES = [
  { role: "Admin", permissions: "Full CRUD, user management", restrictions: "Own company only", color: "bg-destructive/15 text-destructive border-destructive/30" },
  { role: "Analyst", permissions: "Read/write well data and models", restrictions: "Own company only", color: "bg-primary/15 text-primary border-primary/30" },
  { role: "Viewer", permissions: "Read-only access to reports", restrictions: "Own company only", color: "bg-accent/50 text-accent-foreground border-accent" },
  { role: "API Client", permissions: "Programmatic data ingestion", restrictions: "Scoped to assigned wells", color: "bg-muted text-muted-foreground border-border" },
];

const GUARANTEES = [
  {
    id: 1,
    title: "Complete Tenant Isolation",
    description: "A user from Company A cannot query, view, or modify any well data belonging to Company B — enforced at 4 independent layers: JWT, middleware, RLS, and storage.",
    icon: Shield,
  },
  {
    id: 2,
    title: "Zero-Row Default",
    description: "Even with full database access, a query without a valid tenant context will return zero rows due to PostgreSQL RLS policies.",
    icon: Lock,
  },
  {
    id: 3,
    title: "Real-Time Alerting",
    description: "All data access is logged. Any anomalous cross-tenant access attempt triggers an automated security alert within 60 seconds.",
    icon: AlertTriangle,
  },
];

const ENDPOINT_PROTECTIONS = [
  "TLS 1.3 encryption — all data in transit is encrypted",
  "Rate limiting — 1,000 requests/min per company; 100 requests/min per user",
  "JWT validation — signature, expiration, and issuer verified",
  "Tenant context injection — company_id bound to the request thread",
  "RBAC authorization — role-based permissions checked per endpoint",
  "Audit logging — all data access events logged with timestamp and user ID",
];

const DataSecurity = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Data Security & Multi-Tenancy
          <Badge className="bg-primary/20 text-primary border-primary/30 text-sm">v1.0</Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          Technical architecture ensuring complete data isolation between tenants at every layer of the stack.
        </p>
      </div>

      {/* Architecture Overview */}
      <Card className="glass-card border-primary/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Architecture Overview
          </CardTitle>
          <CardDescription>
            Every API request passes through 4 independent security layers before reaching data.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Visual flow */}
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {[
              { label: "Client", sub: "Bearer Token", icon: Users, color: "border-blue-500/40 bg-blue-500/10" },
              { label: "API Gateway", sub: "JWT Verify", icon: Key, color: "border-yellow-500/40 bg-yellow-500/10" },
              { label: "Middleware", sub: "Tenant Inject", icon: Server, color: "border-orange-500/40 bg-orange-500/10" },
              { label: "RLS Policy", sub: "Row Filter", icon: Database, color: "border-red-500/40 bg-red-500/10" },
              { label: "Data", sub: "Isolated Rows", icon: CheckCircle2, color: "border-primary/40 bg-primary/10" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-3 flex-1">
                <div className={`flex-1 p-4 rounded-xl border-2 ${step.color} text-center`}>
                  <step.icon className="h-6 w-6 mx-auto mb-2 text-foreground/80" />
                  <p className="font-semibold text-sm">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-muted-foreground font-bold text-lg hidden md:block">→</span>
                )}
              </div>
            ))}
          </div>

          {/* JWT payload */}
          <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">JWT Token Payload (signed, immutable):</p>
            <pre className="text-xs font-mono text-foreground/80 overflow-x-auto">
{`{
  "sub":        "user_id_uuid",
  "company_id": "company_uuid",   ← cryptographically signed
  "email":      "user@company.com",
  "role":       "analyst | admin | viewer",
  "exp":        1700000000
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Isolation Layers Table */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Multi-Tenancy Isolation Layers
          </CardTitle>
          <CardDescription>
            Five independent mechanisms ensure no cross-tenant data leakage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Layer</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Mechanism</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Protects Against</th>
                </tr>
              </thead>
              <tbody>
                {ISOLATION_LAYERS.map((layer) => (
                  <tr key={layer.layer} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <layer.icon className="h-4 w-4 text-primary" />
                      {layer.layer}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="font-mono text-xs">{layer.mechanism}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{layer.protects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RLS SQL example */}
          <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">PostgreSQL RLS Policy (enforced at DB engine level):</p>
            <pre className="text-xs font-mono text-foreground/80">
{`CREATE POLICY tenant_isolation ON wells
  USING (company_id = current_setting('app.current_tenant')::uuid);

-- Even buggy code with missing WHERE clauses cannot leak data`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RBAC */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Role-Based Access Control (RBAC)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {RBAC_ROLES.map((r) => (
              <div key={r.role} className="p-3 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <Badge className={r.color}>{r.role}</Badge>
                  <span className="text-xs text-muted-foreground">{r.restrictions}</span>
                </div>
                <p className="text-sm text-foreground/80">{r.permissions}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* API Endpoint Protection */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              API Endpoint Protection
            </CardTitle>
            <CardDescription>Multi-layer middleware stack applied in order:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ENDPOINT_PROTECTIONS.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Protection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Data in Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />TLS 1.3 with HSTS headers enforced</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />WebSocket connections encrypted with WSS</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Internal service-to-service calls use mutual TLS (mTLS)</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Certificate rotation via Let's Encrypt (90-day)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Data at Rest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />AES-256 encryption at storage volume level</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Tenant-isolated S3 buckets with deny policies</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Encrypted backup snapshots with CMK</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />AWS KMS with automated key rotation</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Compliance & Audit */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Compliance & Audit
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Audit Logging</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Every data access event is recorded in an immutable audit log with: timestamp, user_id, company_id, action type, resource ID, source IP, and result status.
            </p>
            <Badge variant="outline">Retained for 24 months</Badge>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Penetration Testing</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Annual third-party penetration testing covering: authentication bypass, SQL injection, cross-tenant data access, and privilege escalation.
            </p>
            <Badge variant="outline">Reports available under NDA</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data Residency */}
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Data Residency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            SGOM supports configurable data residency for enterprise clients. Well data can be stored in specific AWS regions (US-East, EU-West, or custom) to comply with local data sovereignty regulations, including requirements relevant to operations in Kazakhstan, Saudi Arabia, and other jurisdictions.
          </p>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline">US-East</Badge>
            <Badge variant="outline">EU-West</Badge>
            <Badge variant="outline">Custom Regions</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security Guarantees */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Security Guarantees
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GUARANTEES.map((g) => (
            <Card key={g.id} className="glass-card border-primary/30 hover:border-primary/60 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <g.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Badge className="bg-primary/20 text-primary border-primary/30">Guarantee {g.id}</Badge>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{g.title}</h3>
                <p className="text-sm text-muted-foreground">{g.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground py-4 border-t border-border/30">
        <p>Confidential — AI Smart Well, Inc. | edward@aismartwell.com | www.aismartwell.com</p>
      </div>
    </div>
  );
};

export default DataSecurity;
