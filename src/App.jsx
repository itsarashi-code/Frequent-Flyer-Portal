import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, Plane, Gift, ArrowLeftRight,
  BarChart3, Settings, Search, Plus, Bell, Menu,
  X, ChevronRight, ArrowUpRight, ArrowDownRight,
  Wallet, TrendingUp, CreditCard, CircleUserRound,
  Trash2, Pencil, Download, CheckCircle2, AlertCircle,
  WifiOff, RefreshCw
} from "lucide-react";
import "./App.css";
import { initialMembers } from "./data/mockData";
import { rewards } from "./data/mockData";
import { sanitizeInput } from "./utils/sanitize";

const STORAGE_KEY = "frequentFlyerPortal_v1";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "miles", label: "Miles Management", icon: Plane },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings }
];

function safeText(value) {
  return sanitizeInput(value);
}

function makeId() {
  return `FFP-${Date.now().toString().slice(-8)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

function getTier(points) {
  if (points >= 15000) return "Platinum";
  if (points >= 8000) return "Gold";
  if (points >= 4000) return "Silver";
  return "Blue";
}

function getInitialData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (
        Array.isArray(parsed.members) &&
        Array.isArray(parsed.transactions)
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Unable to load saved portal data:", error);
  }

  return {
    members: initialMembers,
    transactions: []
  };
}

function App() {
  const [initialData] = useState(getInitialData);
  const [members, setMembers] = useState(initialData.members);
  const [transactions, setTransactions] = useState(initialData.transactions);

  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [showMilesForm, setShowMilesForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");

  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const [milesForm, setMilesForm] = useState({
    type: "Credit",
    amount: "",
    description: ""
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ members, transactions })
      );
    } catch (error) {
      console.error("Unable to save portal data:", error);
    }
  }, [members, transactions]);

  useEffect(() => {
    const updateConnection = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 3500);

    return () => clearTimeout(timer);
  }, [notice]);

  const totalMiles = useMemo(
    () =>
      members.reduce(
        (sum, member) => sum + Number(member.miles || 0),
        0
      ),
    [members]
  );

  const activeMembers = members.filter(
    member => member.status === "Active"
  ).length;

  const filteredMembers = members.filter(member => {
    const term = search.toLowerCase();

    return (
      member.name.toLowerCase().includes(term) ||
      member.id.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term)
    );
  });

  const logAction = (action, details = {}) => {
    console.log("[Portal Analytics]", {
      action,
      details,
      timestamp: new Date().toISOString()
    });
  };

  const simulateLoading = callback => {
    setIsLoading(true);

    setTimeout(() => {
      callback();
      setIsLoading(false);
    }, 350);
  };

  const openAddMember = () => {
    setEditingMember(null);

    setMemberForm({
      name: "",
      email: "",
      phone: ""
    });

    setShowMemberForm(true);
  };

  const openEditMember = member => {
    setEditingMember(member);

    setMemberForm({
      name: member.name,
      email: member.email,
      phone: member.phone
    });

    setShowMemberForm(true);
  };
  const saveMember = (event) => {
    event.preventDefault();

    const name = safeText(memberForm.name).trim();
    const email = safeText(memberForm.email).trim().toLowerCase();
    const phone = safeText(memberForm.phone).replace(/\D/g, "");

    if (!/^[a-zA-Z\s.'-]{2,60}$/.test(name)) {
      setNotice("Please enter a valid name (2–60 characters).");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNotice("Please enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setNotice("Phone number must contain exactly 10 digits.");
      return;
    }

    const duplicate = members.some(
      (member) =>
        member.email.toLowerCase() === email &&
        member.id !== editingMember
    );

    if (duplicate) {
      setNotice("A member with this email already exists.");
      return;
    }

    simulateLoading(() => {
      if (editingMember) {
        setMembers((current) =>
          current.map((member) =>
            member.id === editingMember
              ? { ...member, name, email, phone }
              : member
          )
        );
        setNotice("Member details updated successfully.");
        logAction("member_updated", { memberId: editingMember });
      } else {
        const newMember = {
          id: makeId(),
          name,
          email,
          phone,
          miles: 0,
          tierPoints: 0,
          joined: new Date().toISOString().slice(0, 10),
          status: "Active",
        };

        setMembers((current) => [newMember, ...current]);
        setNotice("New member added successfully.");
        logAction("member_created", { email });
      }

      setShowMemberForm(false);
      setEditingMember(null);
      setMemberForm({ name: "", email: "", phone: "" });
    });
  };

  const deleteMember = (memberId) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) return;

    const confirmed = window.confirm(
      `Delete ${member.name} from the member directory? Transaction history will be retained.`
    );

    if (!confirmed) return;

    setMembers((current) =>
      current.filter((item) => item.id !== memberId)
    );
    setNotice("Member removed. Historical transactions were retained.");
    logAction("member_deleted", { memberId });
  };

  const openMilesForm = (memberId = "") => {
    setSelectedMember(memberId);
    setMilesForm({ type: "Credit", amount: "", description: "" });
    setShowMilesForm(true);
  };

  const processMiles = (event) => {
    event.preventDefault();

    const amount = Number(milesForm.amount);
    const description = safeText(milesForm.description).trim();
    const member = members.find((item) => item.id === selectedMember);

    if (!member) {
      setNotice("Please select a valid member.");
      return;
    }

    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) {
      setNotice("Enter a whole number between 1 and 1,000,000.");
      return;
    }

    if (description.length < 3 || description.length > 100) {
      setNotice("Description must be 3–100 characters.");
      return;
    }

    if (milesForm.type === "Debit" && member.miles < amount) {
      setNotice("Insufficient redeemable miles for this debit.");
      return;
    }

    simulateLoading(() => {
      const newBalance =
        milesForm.type === "Credit"
          ? member.miles + amount
          : member.miles - amount;

      setMembers((current) =>
        current.map((item) =>
          item.id === selectedMember
            ? { ...item, miles: newBalance }
            : item
        )
      );

      const transaction = {
        id: makeId(),
        memberId: member.id,
        memberName: member.name,
        type: milesForm.type,
        amount,
        description,
        date: new Date().toISOString(),
      };

      setTransactions((current) => [transaction, ...current]);
      setShowMilesForm(false);
      setNotice(`${amount.toLocaleString()} miles ${milesForm.type.toLowerCase()}ed successfully.`);
      logAction("miles_transaction", {
        memberId: member.id,
        type: milesForm.type,
        amount,
      });
    });
  };

  const redeemReward = (reward) => {
    const memberId = window.prompt(
      `Enter the member ID to redeem "${reward.name}":`
    );

    if (!memberId) return;

    const member = members.find(
      (item) => item.id.toLowerCase() === memberId.trim().toLowerCase()
    );

    if (!member) {
      setNotice("Member ID not found. Please check and try again.");
      return;
    }

    if (member.miles < reward.cost) {
      setNotice("This member does not have enough redeemable miles.");
      return;
    }

    const confirmed = window.confirm(
      `Redeem ${reward.name} for ${member.name}?\nCost: ${reward.cost.toLocaleString()} miles`
    );

    if (!confirmed) return;

    setMembers((current) =>
      current.map((item) =>
        item.id === member.id
          ? { ...item, miles: item.miles - reward.cost }
          : item
      )
    );

    setTransactions((current) => [
      {
        id: makeId(),
        memberId: member.id,
        memberName: member.name,
        type: "Debit",
        amount: reward.cost,
        description: `Reward redeemed: ${reward.name}`,
        date: new Date().toISOString(),
      },
      ...current,
    ]);

    setNotice(`${reward.name} redeemed successfully.`);
    logAction("reward_redeemed", {
      memberId: member.id,
      reward: reward.name,
    });
  };

  const exportTransactions = () => {
    const headers = [
      "Transaction ID",
      "Member ID",
      "Member Name",
      "Type",
      "Miles",
      "Description",
      "Date",
    ];

    const rows = transactions.map((transaction) => [
      transaction.id,
      transaction.memberId,
      transaction.memberName,
      transaction.type,
      transaction.amount,
      transaction.description,
      transaction.date,
    ]);

    const csvCell = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "frequent-flyer-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);

    setNotice("Transaction report exported.");
    logAction("transactions_exported", { count: transactions.length });
  };

  const resetDemoData = () => {
    const confirmed = window.confirm(
      "Reset all portal data to the original demo records?"
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    setMembers(initialMembers);
    setTransactions([]);
    setSearch("");
    setNotice("Demo data has been reset.");
    logAction("demo_data_reset");
  };

  const pageTitle =
    navigation.find((item) => item.id === activePage)?.label || "Dashboard";

  const changePage = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    setSearch("");
    logAction("navigation", { page });
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Plane size={21} aria-hidden="true" />
          </div>
          <div>
            <strong>FrequentFlyer</strong>
            <span>STAFF PORTAL</span>
          </div>
          <button
            className="icon-button mobile-close"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => changePage(item.id)}
                aria-current={activePage === item.id ? "page" : undefined}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
                {activePage === item.id && (
                  <ChevronRight size={16} className="nav-chevron" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <AlertCircle size={18} />
            </div>
            <strong>Staff workspace</strong>
            <p>Demo environment. No live airline systems connected.</p>
          </div>
          <div className="profile-mini">
            <div className="avatar">AY</div>
            <div>
              <strong>Portal Admin</strong>
              <span>Staff account</span>
            </div>
            <Settings size={17} />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-toggle"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>
            <div>
              <div className="breadcrumb">Workspace / {pageTitle}</div>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <div className={`connection-status ${isOnline ? "online" : "offline"}`}>
              <span className="status-dot" />
              {isOnline ? "Online" : "Offline"}
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => setNotice("You are all caught up.")}
            >
              <Bell size={19} />
            </button>
            <div className="top-avatar" aria-label="Portal Admin account">
              AY
            </div>
          </div>
        </header>

        {!isOnline && (
          <div className="offline-banner" role="status">
            <WifiOff size={17} />
            <span>
              You are offline. Saved demo data remains available on this device.
            </span>
          </div>
        )}

        <div className="page-content">
          {isLoading && (
            <div className="loading-line" role="status">
              <span />
              <span className="sr-only">Loading data</span>
            </div>
          )}

          {notice && (
            <div className="toast" role="status">
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button
                className="toast-close"
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {activePage === "dashboard" && (
            <DashboardPage
              members={members}
              transactions={transactions}
              totalMiles={totalMiles}
              activeMembers={activeMembers}
              onAddMember={openAddMember}
              onAddMiles={() => openMilesForm()}
              onNavigate={changePage}
            />
          )}

          {activePage === "members" && (
            <MembersPage
              members={filteredMembers}
              search={search}
              setSearch={setSearch}
              onAdd={openAddMember}
              onEdit={openEditMember}
              onDelete={deleteMember}
              onAddMiles={openMilesForm}
            />
          )}

          {activePage === "miles" && (
            <MilesPage
              members={members}
              transactions={transactions}
              onAddMiles={openMilesForm}
              onExport={exportTransactions}
            />
          )}

          {activePage === "rewards" && (
            <RewardsPage
              rewards={rewards}
              onRedeem={redeemReward}
            />
          )}

          {activePage === "transactions" && (
            <TransactionsPage
              transactions={transactions}
              onExport={exportTransactions}
            />
          )}

          {activePage === "reports" && (
            <ReportsPage
              members={members}
              transactions={transactions}
              onExport={exportTransactions}
            />
          )}

          {activePage === "settings" && (
            <SettingsPage
              isOnline={isOnline}
              membersCount={members.length}
              transactionsCount={transactions.length}
              onReset={resetDemoData}
            />
          )}
        </div>
      </main>
      {showMemberForm && (
  <MemberModal
    member={editingMember ? members.find((item) => item.id === editingMember) : null}
    onClose={() => setShowMemberForm(false)}
    onSave={saveMember}
    form={memberForm}
    setForm={setMemberForm}
  />
)}
{showMilesForm && (
  <MilesModal
    members={members}
    onClose={() => setShowMilesForm(false)}
    onSave={processMiles}
    selectedMember={selectedMember}
    setSelectedMember={setSelectedMember}
    form={milesForm}
    setForm={setMilesForm}
  />
)}
</div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, detail }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon"><Icon size={19} /></span>
      </div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-foot">
        <span className="stat-change"><TrendingUp size={14} /> {change}</span>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function EmptyState({ icon: Icon = Users, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function DashboardPage({
  members,
  transactions,
  totalMiles,
  activeMembers,
  onAddMember,
  onAddMiles,
  onNavigate,
}) {
  const recent = transactions.slice(0, 5);
  const totalCredits = transactions
    .filter((item) => item.type === "Credit")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <PageHeading
        eyebrow="OVERVIEW"
        title="Good day, Admin"
        description="Here's what's happening across your frequent flyer programme."
        action={
          <button className="primary-button" onClick={onAddMember}>
            <Plus size={17} /> Add member
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total members" value={members.length.toLocaleString()} change="Programme" detail="registered members" icon={Users} />
        <StatCard label="Active members" value={activeMembers.toLocaleString()} change="Current" detail="active accounts" icon={CircleUserRound} />
        <StatCard label="Redeemable miles" value={formatNumber(totalMiles)} change="Balance" detail="across all members" icon={Wallet} />
        <StatCard label="Miles credited" value={formatNumber(totalCredits)} change="Ledger" detail="recorded credits" icon={TrendingUp} />
      </div>

      <div className="dashboard-grid">
        <section className="panel quick-actions-panel">
          <div className="panel-heading">
            <div>
              <h3>Quick actions</h3>
              <p>Common staff operations</p>
            </div>
          </div>
          <div className="quick-actions">
            <button className="quick-action" onClick={onAddMember}>
              <span className="quick-icon"><Plus size={20} /></span>
              <span><strong>Add a member</strong><small>Create a new account</small></span>
              <ChevronRight size={17} />
            </button>
            <button className="quick-action" onClick={onAddMiles}>
              <span className="quick-icon"><Wallet size={20} /></span>
              <span><strong>Manage miles</strong><small>Credit or debit miles</small></span>
              <ChevronRight size={17} />
            </button>
            <button className="quick-action" onClick={() => onNavigate("members")}>
              <span className="quick-icon"><Users size={20} /></span>
              <span><strong>View members</strong><small>Search member records</small></span>
              <ChevronRight size={17} />
            </button>
            <button className="quick-action" onClick={() => onNavigate("reports")}>
              <span className="quick-icon"><BarChart3 size={20} /></span>
              <span><strong>View reports</strong><small>Programme activity</small></span>
              <ChevronRight size={17} />
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Programme snapshot</h3>
              <p>Current demo environment</p>
            </div>
            <span className="neutral-tag">DEMO</span>
          </div>
          <div className="snapshot-list">
            <div><span>Registered members</span><strong>{members.length}</strong></div>
            <div><span>Total transactions</span><strong>{transactions.length}</strong></div>
            <div><span>Miles credited</span><strong>{formatNumber(totalCredits)}</strong></div>
            <div><span>Average member balance</span><strong>{members.length ? formatNumber(Math.round(totalMiles / members.length)) : "0"}</strong></div>
          </div>
          <div className="snapshot-note">
            <AlertCircle size={16} />
            <span>All figures are based on locally stored sample data.</span>
          </div>
        </section>
      </div>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Recent transactions</h3>
            <p>Latest activity in the programme</p>
          </div>
          <button className="text-button" onClick={() => onNavigate("transactions")}>
            View all <ArrowUpRight size={15} />
          </button>
        </div>
        {recent.length ? (
          <TransactionTable transactions={recent} />
        ) : (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Miles activity will appear here when staff record a transaction."
            action={<button className="secondary-button" onClick={onAddMiles}>Record miles</button>}
          />
        )}
      </section>
    </>
  );
}

function TransactionTable({ transactions }) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Transaction</th>
            <th>Type</th>
            <th>Miles</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="table-person">
                  <span className="avatar small-avatar">
                    {(item.memberName || "M").slice(0, 1).toUpperCase()}
                  </span>
                  <div><strong>{item.memberName || "Former member"}</strong><small>{item.memberId}</small></div>
                </div>
              </td>
              <td>{item.description}</td>
              <td><span className={`type-tag ${item.type.toLowerCase()}`}>{item.type}</span></td>
              <td className={item.type === "Credit" ? "positive-value" : "negative-value"}>
                {item.type === "Credit" ? "+" : "−"}{formatNumber(item.amount)}
              </td>
              <td>{new Date(item.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MembersPage({ members, search, setSearch, onAdd, onEdit, onDelete, onAddMiles }) {
  return (
    <>
      <PageHeading
        eyebrow="MEMBER MANAGEMENT"
        title="Member directory"
        description="Create, review and manage frequent flyer member accounts."
        action={<button className="primary-button" onClick={onAdd}><Plus size={17} /> Add member</button>}
      />

      <section className="panel table-panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="search"
              aria-label="Search members"
              placeholder="Search by name, email or member ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <span className="result-count">{members.length} members</span>
        </div>

        {members.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Member</th><th>Member ID</th><th>Tier</th><th>Redeemable miles</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="table-person">
                        <span className="avatar small-avatar">{member.name.slice(0, 1).toUpperCase()}</span>
                        <div><strong>{member.name}</strong><small>{member.email}</small></div>
                      </div>
                    </td>
                    <td><span className="id-text">{member.id}</span></td>
                    <td><span className={`tier-tag ${getTier(member.tierPoints).toLowerCase()}`}>{getTier(member.tierPoints)}</span></td>
                    <td><strong>{formatNumber(member.miles)}</strong></td>
                    <td><span className="status-tag">{member.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="small-icon-button" title="Edit member" aria-label={`Edit ${member.name}`} onClick={() => onEdit(member)}><Pencil size={16} /></button>
                        <button className="small-icon-button" title="Manage miles" aria-label={`Manage miles for ${member.name}`} onClick={() => onAddMiles(member.id)}><Wallet size={16} /></button>
                        <button className="small-icon-button danger-action" title="Delete member" aria-label={`Delete ${member.name}`} onClick={() => onDelete(member.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No members found"
            description={search ? "Try another name, email or member ID." : "Add your first member to get started."}
            action={<button className="primary-button" onClick={onAdd}><Plus size={16} /> Add member</button>}
          />
        )}
      </section>
    </>
  );
}

function MilesPage({ transactions, onAddMiles, onExport }) {
  const credits = transactions.filter((item) => item.type === "Credit").reduce((sum, item) => sum + item.amount, 0);
  const debits = transactions.filter((item) => item.type === "Debit").reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <PageHeading
        eyebrow="MILES MANAGEMENT"
        title="Miles ledger"
        description="Record and review redeemable miles activity. Tier points are tracked separately."
        action={<button className="primary-button" onClick={onAddMiles}><Plus size={17} /> New transaction</button>}
      />
      <div className="stats-grid three-stats">
        <StatCard label="Total credited" value={formatNumber(credits)} change="Credits" detail="miles added" icon={ArrowDownRight} />
        <StatCard label="Total debited" value={formatNumber(debits)} change="Debits" detail="miles deducted" icon={ArrowUpRight} />
        <StatCard label="Net movement" value={formatNumber(credits - debits)} change="Net" detail="miles movement" icon={Wallet} />
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div><h3>Transaction history</h3><p>Full miles activity ledger</p></div>
          <button className="secondary-button" onClick={onExport}><Download size={16} /> Export CSV</button>
        </div>
        {transactions.length ? <TransactionTable transactions={transactions} /> : (
          <EmptyState icon={ArrowLeftRight} title="No miles activity" description="Record a credit or debit to start your transaction history." action={<button className="primary-button" onClick={onAddMiles}><Plus size={16} /> New transaction</button>} />
        )}
      </section>
      <p className="footnote"><AlertCircle size={15} /> Miles are redeemable programme currency. Tier points determine member status and are not deducted when rewards are redeemed.</p>
    </>
  );
}

function RewardsPage({ rewards, onRedeem }) {
  return (
    <>
      <PageHeading eyebrow="REWARD CATALOGUE" title="Rewards" description="Explore sample rewards and redeem them using a member's available miles." />
      <div className="rewards-grid">
        {rewards.map((reward) => (
          <article className="reward-card" key={reward.id}>
            <div className="reward-art"><Gift size={31} /></div>
            <span className="eyebrow">REWARD</span>
            <h3>{reward.name}</h3>
            <p>{reward.description}</p>
            <div className="reward-bottom">
              <div><strong>{formatNumber(reward.cost)}</strong><small>miles required</small></div>
              <button className="primary-button compact-button" onClick={() => onRedeem(reward)}>Redeem</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function TransactionsPage({ transactions, onExport }) {
  return (
    <>
      <PageHeading
        eyebrow="ACTIVITY LOG"
        title="Transactions"
        description="Review the recorded credit, debit and reward redemption activity."
        action={<button className="secondary-button" onClick={onExport}><Download size={16} /> Export CSV</button>}
      />
      <section className="panel table-panel">
        <div className="panel-heading"><div><h3>All transactions</h3><p>{transactions.length} records in this demo workspace</p></div></div>
        {transactions.length ? <TransactionTable transactions={transactions} /> : <EmptyState icon={ArrowLeftRight} title="No transactions recorded" description="Your transaction records will appear here." />}
      </section>
    </>
  );
}

function ReportsPage({ members, transactions, onExport }) {
  const credits = transactions.filter((item) => item.type === "Credit").reduce((sum, item) => sum + item.amount, 0);
  const debits = transactions.filter((item) => item.type === "Debit").reduce((sum, item) => sum + item.amount, 0);
  const tiers = ["Blue", "Silver", "Gold", "Platinum"];
  const tierCounts = tiers.map((tier) => ({
    tier,
    count: members.filter((member) => getTier(member.tierPoints) === tier).length,
  }));
  const maxTierCount = Math.max(1, ...tierCounts.map((item) => item.count));

  return (
    <>
      <PageHeading
        eyebrow="PROGRAMME INSIGHTS"
        title="Reports & analytics"
        description="A quick view of membership distribution and miles activity."
        action={<button className="secondary-button" onClick={onExport}><Download size={16} /> Export transactions</button>}
      />
      <div className="stats-grid three-stats">
        <StatCard label="Total members" value={members.length} change="Accounts" detail="in directory" icon={Users} />
        <StatCard label="Miles credited" value={formatNumber(credits)} change="Credit" detail="total movement" icon={ArrowDownRight} />
        <StatCard label="Miles debited" value={formatNumber(debits)} change="Debit" detail="total movement" icon={ArrowUpRight} />
      </div>
      <div className="reports-grid">
        <section className="panel">
          <div className="panel-heading"><div><h3>Tier distribution</h3><p>Members by current tier</p></div></div>
          <div className="tier-chart">
            {tierCounts.map((item) => (
              <div className="tier-chart-row" key={item.tier}>
                <div><span>{item.tier}</span><strong>{item.count}</strong></div>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.count / maxTierCount) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h3>Activity summary</h3><p>Current demo records</p></div></div>
          <div className="snapshot-list">
            <div><span>Total transactions</span><strong>{transactions.length}</strong></div>
            <div><span>Credit transactions</span><strong>{transactions.filter((item) => item.type === "Credit").length}</strong></div>
            <div><span>Debit transactions</span><strong>{transactions.filter((item) => item.type === "Debit").length}</strong></div>
            <div><span>Reward redemptions</span><strong>{transactions.filter((item) => item.description.startsWith("Reward redeemed:")).length}</strong></div>
          </div>
          <p className="footnote"><AlertCircle size={15} /> Analytics are calculated from the local demo dataset.</p>
        </section>
      </div>
    </>
  );
}

function SettingsPage({ isOnline, membersCount, transactionsCount, onReset }) {
  return (
    <>
      <PageHeading eyebrow="WORKSPACE CONFIGURATION" title="Settings" description="Review the demo workspace status and local data controls." />
      <div className="settings-grid">
        <section className="panel settings-panel">
          <div className="settings-icon"><Settings size={21} /></div>
          <h3>Workspace status</h3>
          <p>Basic information about this local prototype.</p>
          <div className="snapshot-list">
            <div><span>Connection</span><strong>{isOnline ? "Online" : "Offline"}</strong></div>
            <div><span>Members stored</span><strong>{membersCount}</strong></div>
            <div><span>Transactions stored</span><strong>{transactionsCount}</strong></div>
            <div><span>Storage</span><strong>Browser local storage</strong></div>
          </div>
        </section>
        <section className="panel settings-panel">
          <div className="settings-icon"><RefreshCw size={21} /></div>
          <h3>Demo data</h3>
          <p>Restore the original sample member records and clear locally created transactions.</p>
          <div className="warning-note"><AlertCircle size={17} /><span>This action cannot be undone. Export any transaction records you need first.</span></div>
          <button className="danger-button" onClick={onReset}><RefreshCw size={16} /> Reset demo data</button>
        </section>
      </div>
      <div className="settings-footer">
        <CreditCard size={16} /> Frequent Flyer Staff Portal · Prototype build · No live airline integration
      </div>
    </>
  );
}

function MemberModal({ member, onClose, onSave, form, setForm }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="member-modal-title">
        <div className="modal-heading">
          <div><span className="eyebrow">MEMBER RECORD</span><h2 id="member-modal-title">{member ? "Edit member" : "Add new member"}</h2></div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={onSave}>
          <label className="field-label">Full name
            <input required minLength={2} maxLength={60} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter member name" />
          </label>
          <label className="field-label">Email address
            <input required type="email" maxLength={100} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" />
          </label>
          <label className="field-label">Phone number
            <input required type="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit mobile number" />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button"><CheckCircle2 size={16} /> {member ? "Save changes" : "Create member"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
function MilesModal({ members, onClose, onSave, selectedMember, setSelectedMember, form, setForm }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="miles-modal-title">
        <div className="modal-heading">
          <div><span className="eyebrow">MILES MANAGEMENT</span><h2 id="miles-modal-title">New transaction</h2></div>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={onSave}>
          <label className="field-label">Select member
            <select required value={selectedMember} onChange={(event) => setSelectedMember(event.target.value)}>
              <option value="">Choose a member</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.id}</option>)}
            </select>
          </label>
          <label className="field-label">Transaction type
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              <option value="Credit">Credit miles</option>
              <option value="Debit">Debit miles</option>
            </select>
          </label>
          <label className="field-label">Miles amount
            <input required type="number" min="1" max="1000000" step="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Enter whole number" />
          </label>
          <label className="field-label">Description
            <input required minLength={3} maxLength={100} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="e.g. Flight reward credit" />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button"><CheckCircle2 size={16} /> Record transaction</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default App;          