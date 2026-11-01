import React, { useCallback, useEffect, useMemo, useState } from "react";
import { superAdminService } from "../../services/api";
import { MODULES_REGISTRY } from "../../constants/modulesRegistry";
import { SkeletonList } from "../../components/Skeleton";
import { PageHeader, EmptyState, ErrorState, StatusBadge, ConfirmDialog, useToast, apiError } from "../../components/superadmin/ui";

const allSubKeys = (module) => module.subModules.map((s) => s.key);

const SAModules = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [modules, setModules] = useState([]);
  const [subs, setSubs] = useState({});
  const [expanded, setExpanded] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [toast, notify] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await superAdminService.getSchools();
      setSchools(res.data.data);
    } catch (err) {
      setError(apiError(err, "Failed to load schools"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(() => schools.find((s) => s._id === selectedId) || null, [schools, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setModules(selected.enabledModules || []);
    setSubs(selected.enabledSubModules || {});
    setExpanded({});
  }, [selected]);

  const dirty = useMemo(() => {
    if (!selected) return false;
    const a = [...(selected.enabledModules || [])].sort().join(",");
    const b = [...modules].sort().join(",");
    if (a !== b) return true;
    return MODULES_REGISTRY.some((m) => {
      const before = [...((selected.enabledSubModules || {})[m.key] || [])].sort().join(",");
      const after = [...(subs[m.key] || [])].sort().join(",");
      return modules.includes(m.key) && before !== after;
    });
  }, [selected, modules, subs]);

  const toggleModule = (module) => {
    if (modules.includes(module.key)) {
      setModules(modules.filter((k) => k !== module.key));
    } else {
      setModules([...modules, module.key]);
      setSubs((prev) => ({ ...prev, [module.key]: prev[module.key]?.length ? prev[module.key] : allSubKeys(module) }));
    }
  };

  const toggleSub = (module, subKey) => {
    const current = subs[module.key] || [];
    setSubs({
      ...subs,
      [module.key]: current.includes(subKey) ? current.filter((k) => k !== subKey) : [...current, subKey],
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const subPayload = {};
      modules.forEach((key) => {
        subPayload[key] = subs[key] || [];
      });
      await superAdminService.updateSchoolModules(selected._id, { enabledModules: modules, enabledSubModules: subPayload });
      notify("Module access updated. Data of disabled modules is kept.");
      setConfirm(false);
      await load();
    } catch (err) {
      notify(apiError(err, "Failed to update module access"), "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredSchools = schools.filter((s) => {
    const term = search.trim().toLowerCase();
    return !term || s.schoolName?.toLowerCase().includes(term) || s.campusId?.toLowerCase().includes(term);
  });

  const removed = selected ? (selected.enabledModules || []).filter((k) => !modules.includes(k)) : [];

  return (
    <>
      {toast}
      <PageHeader
        title="Modules & Permissions"
        subtitle="School entitlements: which modules and sub-modules each school can use. Role permissions inside a school are managed separately by the School Admin."
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonList count={5} theme="dark" />
      ) : schools.length === 0 ? (
        <div className="sa2-card">
          <EmptyState message="Register a school first to manage its module access." />
        </div>
      ) : (
        <div className="sa2-grid" style={{ gridTemplateColumns: "minmax(240px, 320px) minmax(0, 1fr)", alignItems: "start" }}>
          <div className="sa2-card">
            <input className="sa2-input" placeholder="Search schools..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
            <ul className="sa2-list">
              {filteredSchools.length === 0 && <li className="sa2-muted">No schools match.</li>}
              {filteredSchools.map((s) => (
                <li key={s._id} style={{ padding: 0, border: 0 }}>
                  <button
                    className={`sa2-nav-item ${selectedId === s._id ? "active" : ""}`}
                    onClick={() => setSelectedId(s._id)}
                  >
                    <span style={{ flex: 1 }}>
                      {s.schoolName}
                      <span className="sa2-cell-sub">
                        {s.campusId} · {(s.enabledModules || []).length}/{MODULES_REGISTRY.length} modules
                      </span>
                    </span>
                    {!s.isActive && <StatusBadge status="Suspended" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sa2-card">
            {!selected ? (
              <EmptyState title="Select a school" message="Choose a school to view and change its feature access." />
            ) : (
              <>
                <div className="sa2-page-header" style={{ marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{selected.schoolName}</h3>
                    <span className="sa2-muted">
                      {modules.length} of {MODULES_REGISTRY.length} modules enabled
                    </span>
                  </div>
                  <div className="sa2-page-actions">
                    <button
                      className="sa2-btn"
                      onClick={() => {
                        setModules(MODULES_REGISTRY.map((m) => m.key));
                        setSubs(Object.fromEntries(MODULES_REGISTRY.map((m) => [m.key, allSubKeys(m)])));
                      }}
                    >
                      Enable all
                    </button>
                    <button className="sa2-btn primary" disabled={!dirty || saving} onClick={() => (removed.length ? setConfirm(true) : save())}>
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>

                {MODULES_REGISTRY.map((module) => {
                  const on = modules.includes(module.key);
                  const open = expanded[module.key];
                  const active = subs[module.key] || [];
                  return (
                    <div className="sa2-module-card" key={module.key}>
                      <div className="sa2-module-head">
                        <label>
                          <input type="checkbox" checked={on} onChange={() => toggleModule(module)} />
                          {module.name}
                        </label>
                        {on && (
                          <span className="sa2-muted">
                            {active.length}/{module.subModules.length} sub-modules
                          </span>
                        )}
                        <button className="sa2-btn sm" onClick={() => setExpanded({ ...expanded, [module.key]: !open })} disabled={!on}>
                          {open ? "Hide" : "Sub-modules"}
                        </button>
                      </div>
                      {on && open && (
                        <div className="sa2-sub-grid">
                          {module.subModules.map((sub) => (
                            <label key={sub.key}>
                              <input type="checkbox" checked={active.includes(sub.key)} onChange={() => toggleSub(module, sub.key)} />
                              {sub.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title="Disable modules?"
          confirmLabel="Disable and save"
          danger
          busy={saving}
          onConfirm={save}
          onClose={() => setConfirm(false)}
          message={`Users of ${selected?.schoolName} will immediately lose access to: ${removed
            .map((k) => MODULES_REGISTRY.find((m) => m.key === k)?.name || k)
            .join(", ")}. Their data is not deleted and returns when the module is enabled again.`}
        />
      )}
    </>
  );
};

export default SAModules;
