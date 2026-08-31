// Admin Panel Logic for ARJU ONLINE SERVICES

let currentApplications = [];
let activeAppId = null;
let currentTab = 'applications';

// Helper: Get Auth Headers
function getAuthHeaders() {
  const token = localStorage.getItem('aos_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// Initial Auth Check
async function checkAuth() {
  try {
    const res = await fetch('/api/admin/me', {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      window.location.href = '/admin/login.html';
      return false;
    }

    const data = await res.json();
    if (data.success && data.user) {
      document.getElementById('currentUsername').textContent = data.user.displayName || data.user.username;
      return true;
    } else {
      window.location.href = '/admin/login.html';
      return false;
    }
  } catch (err) {
    window.location.href = '/admin/login.html';
    return false;
  }
}

// Load Dashboard Statistics
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success && data.stats) {
      document.getElementById('statTotal').textContent = data.stats.total || 0;
      document.getElementById('statPending').textContent = data.stats.pending || 0;
      document.getElementById('statProgress').textContent = data.stats.inProgress || 0;
      document.getElementById('statCompleted').textContent = data.stats.completed || 0;
      document.getElementById('statToday').textContent = data.stats.today || 0;
      document.getElementById('contactCountBadge').textContent = data.stats.contacts || 0;
    }
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// Load Applications List
async function loadApplications() {
  const tbody = document.getElementById('applicationsTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading application data...</p>
      </td>
    </tr>
  `;

  const search = document.getElementById('searchInput').value.trim();
  const status = document.getElementById('statusFilter').value;
  const service = document.getElementById('serviceFilter').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status !== 'all') params.append('status', status);
  if (service !== 'all') params.append('service', service);

  try {
    const res = await fetch(`/api/admin/applications?${params.toString()}`, {
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      window.location.href = '/admin/login.html';
      return;
    }

    const data = await res.json();
    if (data.success) {
      currentApplications = data.applications || [];
      renderApplicationsTable(currentApplications);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><p class="text-danger">Error: ${data.error}</p></td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><p class="text-danger">Failed to load applications.</p></td></tr>`;
  }
}

// Render Applications Table Rows
function renderApplicationsTable(apps) {
  const tbody = document.getElementById('applicationsTableBody');
  if (!apps || apps.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No applications found matching your criteria.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    const dateFormatted = new Date(app.created_at || Date.now()).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });

    let statusBadgeClass = 'badge-pending';
    if (app.status === 'In Progress') statusBadgeClass = 'badge-progress';
    if (app.status === 'Completed') statusBadgeClass = 'badge-completed';
    if (app.status === 'Rejected') statusBadgeClass = 'badge-rejected';

    const cleanPhone = (app.phone || '').replace(/[^0-9]/g, '');
    const waMsg = encodeURIComponent(`Hello ${app.name}, this is ARJU ONLINE SERVICES regarding your application (${app.app_id}) for ${app.service}.`);

    return `
      <tr>
        <td><strong>${app.app_id}</strong></td>
        <td style="color: #64748b; font-size: 12.5px;">${dateFormatted}</td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(app.name)}</div>
          ${app.father_name ? `<div style="font-size: 11.5px; color: #64748b;">S/o: ${escapeHtml(app.father_name)}</div>` : ''}
        </td>
        <td>
          <a href="tel:${escapeHtml(app.phone)}" style="color: #2563eb; text-decoration: none; font-weight: 600;">
            <i class="fas fa-phone-alt" style="font-size: 11px;"></i> ${escapeHtml(app.phone)}
          </a>
        </td>
        <td><span class="badge badge-service">${escapeHtml(app.service)}</span></td>
        <td><span class="badge ${statusBadgeClass}">${escapeHtml(app.status || 'Pending')}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon" title="View & Edit" onclick="openAppModal('${app.app_id}')">
              <i class="fas fa-eye"></i>
            </button>
            <a href="https://wa.me/91${cleanPhone}?text=${waMsg}" target="_blank" class="btn-icon wa" title="Chat on WhatsApp">
              <i class="fab fa-whatsapp"></i>
            </a>
            <a href="tel:${escapeHtml(app.phone)}" class="btn-icon call" title="Call Customer">
              <i class="fas fa-phone"></i>
            </a>
            <button class="btn-icon del" title="Delete" onclick="deleteApp('${app.app_id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open Application Detail Modal
window.openAppModal = function(appId) {
  const app = currentApplications.find(a => a.app_id === appId);
  if (!app) return;

  activeAppId = appId;
  document.getElementById('modalAppId').textContent = app.app_id;
  document.getElementById('modalDate').textContent = new Date(app.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short'
  });
  document.getElementById('modalName').textContent = app.name || '--';
  document.getElementById('modalFather').textContent = app.father_name || '--';
  document.getElementById('modalPhone').textContent = app.phone || '--';
  document.getElementById('modalAltPhone').textContent = app.alt_phone || '--';
  document.getElementById('modalEmail').textContent = app.email || '--';
  document.getElementById('modalDob').textContent = app.dob || '--';
  document.getElementById('modalService').textContent = app.service || '--';
  document.getElementById('modalAddress').textContent = app.address || '--';
  document.getElementById('modalMessage').textContent = app.message || 'No additional note provided.';

  document.getElementById('modalStatusSelect').value = app.status || 'Pending';
  document.getElementById('modalNotes').value = app.notes || '';

  // Set action buttons
  const cleanPhone = (app.phone || '').replace(/[^0-9]/g, '');
  document.getElementById('modalCallBtn').href = `tel:${app.phone}`;
  document.getElementById('modalWaBtn').href = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(app.name)},%20this%20is%20ARJU%20ONLINE%20SERVICES%20regarding%20your%20application%20(${app.app_id})%20for%20${encodeURIComponent(app.service)}.`;

  document.getElementById('appModal').classList.add('open');
};

// Close Modal
document.getElementById('modalCloseBtn').addEventListener('click', () => {
  document.getElementById('appModal').classList.remove('open');
  activeAppId = null;
});

// Save Application Changes
document.getElementById('modalSaveBtn').addEventListener('click', async () => {
  if (!activeAppId) return;

  const status = document.getElementById('modalStatusSelect').value;
  const notes = document.getElementById('modalNotes').value;

  const saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const res = await fetch(`/api/admin/applications/${activeAppId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes })
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById('appModal').classList.remove('open');
      loadStats();
      loadApplications();
    } else {
      alert('Error updating application: ' + data.error);
    }
  } catch (err) {
    alert('Failed to save changes: ' + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
});

// Print Application Sheet
document.getElementById('modalPrintBtn').addEventListener('click', () => {
  const app = currentApplications.find(a => a.app_id === activeAppId);
  if (!app) return;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Application Receipt - ${escapeHtml(app.app_id)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        .receipt-header { border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .receipt-header h1 { margin: 0; color: #1e40af; font-size: 24px; }
        .receipt-header p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
        .app-id-tag { background: #ea580c; color: white; padding: 6px 14px; border-radius: 6px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 10px 12px; border: 1px solid #cbd5e1; text-align: left; font-size: 14px; }
        th { background: #f1f5f9; width: 30%; color: #475569; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <div>
          <h1>ARJU ONLINE SERVICES</h1>
          <p>Government Verified CSC & Airtel Payments Bank Center</p>
          <p>Haldia Pather, Ghuigubari, Kalgachia, Barpeta, Assam - 781319 | +91 9365225213</p>
        </div>
        <div class="app-id-tag">${escapeHtml(app.app_id)}</div>
      </div>

      <h3>SERVICE APPLICATION FORM</h3>
      <table>
        <tr><th>Application ID</th><td><strong>${escapeHtml(app.app_id)}</strong></td></tr>
        <tr><th>Submission Date</th><td>${escapeHtml(new Date(app.created_at).toLocaleString())}</td></tr>
        <tr><th>Applicant Name</th><td><strong>${escapeHtml(app.name)}</strong></td></tr>
        <tr><th>Father's Name</th><td>${escapeHtml(app.father_name || 'N/A')}</td></tr>
        <tr><th>Phone Number</th><td>${escapeHtml(app.phone)}</td></tr>
        <tr><th>Alternate Phone</th><td>${escapeHtml(app.alt_phone || 'N/A')}</td></tr>
        <tr><th>Email Address</th><td>${escapeHtml(app.email || 'N/A')}</td></tr>
        <tr><th>Date of Birth</th><td>${escapeHtml(app.dob || 'N/A')}</td></tr>
        <tr><th>Service Requested</th><td><strong>${escapeHtml(app.service)}</strong></td></tr>
        <tr><th>Status</th><td>${escapeHtml(app.status || 'Pending')}</td></tr>
        <tr><th>Address</th><td>${escapeHtml(app.address)}</td></tr>
        <tr><th>Customer Note</th><td>${escapeHtml(app.message || 'N/A')}</td></tr>
        <tr><th>Staff Processing Notes</th><td>${escapeHtml(app.notes || 'None')}</td></tr>
      </table>

      <div class="footer">
        <span>Verified by ARJU ONLINE SERVICES</span>
        <span>Authorized Signature / Stamp</span>
      </div>
      <script>window.print();<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
});

// Delete Application
window.deleteApp = async function(appId) {
  if (!confirm(`Are you sure you want to delete application ${appId}? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/applications/${appId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await res.json();
    if (data.success) {
      if (activeAppId === appId) {
        document.getElementById('appModal').classList.remove('open');
      }
      loadStats();
      loadApplications();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to delete application: ' + err.message);
  }
};

// Delete from Modal
document.getElementById('modalDeleteBtn').addEventListener('click', () => {
  if (activeAppId) deleteApp(activeAppId);
});

// Export to CSV
document.getElementById('exportBtn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/admin/export', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Export failed');
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arju_applications_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    alert('Failed to export CSV: ' + err.message);
  }
});

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    currentTab = tab;

    document.getElementById('tabContentApplications').style.display = tab === 'applications' ? 'block' : 'none';
    document.getElementById('tabContentContacts').style.display = tab === 'contacts' ? 'block' : 'none';
    document.getElementById('tabContentLogs').style.display = tab === 'logs' ? 'block' : 'none';

    if (tab === 'contacts') loadContacts();
    if (tab === 'logs') loadLogs();
  });
});

// Load Contacts Tab
async function loadContacts() {
  const tbody = document.getElementById('contactsTableBody');
  tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading messages...</p></td></tr>`;

  try {
    const res = await fetch('/api/admin/contacts', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success && data.contacts) {
      if (data.contacts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-inbox"></i><p>No contact messages yet.</p></td></tr>`;
        return;
      }

      tbody.innerHTML = data.contacts.map(c => `
        <tr>
          <td style="font-size: 12px; color: #64748b;">${new Date(c.created_at).toLocaleString('en-IN')}</td>
          <td><strong>${escapeHtml(c.name)}</strong></td>
          <td><a href="tel:${escapeHtml(c.phone)}" style="color: #2563eb;">${escapeHtml(c.phone)}</a></td>
          <td>${c.email ? `<a href="mailto:${escapeHtml(c.email)}" style="color: #2563eb;">${escapeHtml(c.email)}</a>` : '--'}</td>
          <td><strong>${escapeHtml(c.subject)}</strong></td>
          <td style="max-width: 300px;">${escapeHtml(c.message)}</td>
          <td>
            <a href="https://wa.me/91${(c.phone || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(c.name)},%20this%20is%20ARJU%20ONLINE%20SERVICES." target="_blank" class="btn-icon wa" title="WhatsApp">
              <i class="fab fa-whatsapp"></i>
            </a>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><p class="text-danger">Failed to load contacts.</p></td></tr>`;
  }
}

// Load Activity Logs
async function loadLogs() {
  const tbody = document.getElementById('logsTableBody');
  tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading activity logs...</p></td></tr>`;

  try {
    const res = await fetch('/api/admin/logs', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success && data.logs) {
      if (data.logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><p>No activity logs yet.</p></td></tr>`;
        return;
      }

      tbody.innerHTML = data.logs.map(l => `
        <tr>
          <td style="font-size: 12px; color: #64748b;">${new Date(l.timestamp).toLocaleString('en-IN')}</td>
          <td><strong><i class="fas fa-user-shield"></i> ${escapeHtml(l.username)}</strong></td>
          <td><span class="badge badge-progress">${escapeHtml(l.action)}</span></td>
          <td>${escapeHtml(l.details || '')}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><p class="text-danger">Failed to load logs.</p></td></tr>`;
  }
}

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await fetch('/api/admin/logout', { method: 'POST', headers: getAuthHeaders() });
  } catch (e) {}
  localStorage.removeItem('aos_token');
  localStorage.removeItem('aos_user');
  window.location.href = '/admin/login.html';
});

// Refresh Button
document.getElementById('refreshBtn').addEventListener('click', () => {
  loadStats();
  if (currentTab === 'applications') loadApplications();
  if (currentTab === 'contacts') loadContacts();
  if (currentTab === 'logs') loadLogs();
});

// Real-time Filters
document.getElementById('searchInput').addEventListener('input', debounce(() => loadApplications(), 300));
document.getElementById('statusFilter').addEventListener('change', () => loadApplications());
document.getElementById('serviceFilter').addEventListener('change', () => loadApplications());

// Utility: Debounce
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Utility: HTML Escape
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
    }
  });
}

// Initialize on Page Load
(async () => {
  const isAuthed = await checkAuth();
  if (isAuthed) {
    loadStats();
    loadApplications();
  }
})();
