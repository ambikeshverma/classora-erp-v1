import React, { useCallback, useEffect, useState } from "react";
import { superAdminService } from "../../services/api";
import { SkeletonTable } from "../../components/Skeleton";
import { PageHeader, EmptyState, ErrorState, Pagination, formatDateTime, apiError } from "../../components/superadmin/ui";

const CATEGORIES = [
  ["", "All"],
  ["school", "Schools"],
  ["modules", "Modules"],
  ["subscription", "Subscriptions"],
  ["billing", "Billing"],
  ["settings", "Settings"],
  ["announcement", "Announcements"],
  ["security", "Security"],
];

const SAActivity = () => {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await superAdminService.getAuditLogs({ page, limit: 20, category, search: query });
      setRows(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(apiError(err, "Failed to load activity"));
    } finally {
      setLoading(false);
    }
  }, [page, category, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <>
      <PageHeader title="Activity Log" subtitle="Audit trail of school, module, subscription, billing and settings actions" />

      <div className="sa2-toolbar">
        <input className="sa2-input" placeholder="Search by school, action or admin..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="sa2-chips">
          {CATEGORIES.map(([value, label]) => (
            <button
              key={value || "all"}
              className={`sa2-chip ${category === value ? "active" : ""}`}
              onClick={() => {
                setCategory(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonTable rows={8} columns={5} />
      ) : rows.length === 0 ? (
        <div className="sa2-card">
          <EmptyState message="No activity has been recorded for this filter yet." />
        </div>
      ) : (
        <>
          <div className="sa2-table-wrap">
            <table className="sa2-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>School</th>
                  <th>Details</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td>{formatDateTime(r.createdAt)}</td>
                    <td>
                      <span className="sa2-badge gray">{r.action}</span>
                    </td>
                    <td>{r.schoolName || "-"}</td>
                    <td>{r.summary || "-"}</td>
                    <td>{r.actorEmail || r.actorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />
        </>
      )}
    </>
  );
};

export default SAActivity;
