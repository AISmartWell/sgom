import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole, ALL_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type AppRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, Users } from "lucide-react";
import RoleFlowDemo from "@/components/roles/RoleFlowDemo";
import { toast } from "sonner";

interface DirectoryUser {
  user_id: string;
  email: string | null;
  role: AppRole | null;
  created_at: string;
}

const UserRoles = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      console.error(error);
      toast.error("Could not load users");
    } else {
      setUsers((data ?? []) as DirectoryUser[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!roleLoading && isAdmin) load();
    else if (!roleLoading) setLoading(false);
  }, [roleLoading, isAdmin]);

  const changeRole = async (userId: string, role: AppRole) => {
    setSavingId(userId);
    const { error } = await supabase.rpc("admin_set_user_role", { _user_id: userId, _role: role });
    if (error) {
      console.error(error);
      toast.error("Could not update role");
    } else {
      toast.success(`Role updated to ${ROLE_LABELS[role]}`);
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role } : u)));
    }
    setSavingId(null);
  };

  if (roleLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading users…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="glass-card max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-muted-foreground" />
              <CardTitle>Administrators only</CardTitle>
            </div>
            <CardDescription>
              Role management is available to platform administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Team & Roles</h1>
          <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">ADMIN</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Engineers enter data. Geologists and production engineers review conclusions and forecasts in read-only mode.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {ALL_ROLES.filter((r) => r !== "investor").map((r) => (
          <Card key={r} className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono tracking-wide">{ROLE_LABELS[r]}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <RoleFlowDemo />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Platform users ({users.length})</CardTitle>
          <CardDescription>Users without a role behave as administrators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <div
              key={u.user_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border/60 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{u.email ?? u.user_id}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {savingId === u.user_id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Select
                  value={u.role ?? "admin"}
                  onValueChange={(v) => changeRole(u.user_id, v as AppRole)}
                  disabled={savingId === u.user_id}
                >
                  <SelectTrigger className="w-[260px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground">No users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoles;
