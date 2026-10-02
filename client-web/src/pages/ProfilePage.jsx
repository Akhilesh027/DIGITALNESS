import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Package,
  Shield,
  LogOut,
  Sparkles,
  CheckCircle2,
  Lock,
  Edit3,
  Globe,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { client, customer, logout, refreshProfile, updateProfile, changePassword, profileLoading } = useAuth();
  const navigate = useNavigate();

  const [logoutModal, setLogoutModal] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Edit profile state
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    companyName: "",
    businessType: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    website: "",
    instagram: "",
    facebook: "",
    linkedin: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState("");

  const clientName = client?.name || customer?.name || "Client Representative";
  const clientEmail = client?.email || customer?.email || "client@company.com";
  const clientPhone =
    client?.phone || customer?.phone || customer?.contactNumbers?.[0] || "+91 98765 43210";
  const companyName = customer?.companyName || customer?.name || client?.name || "Innovate Enterprise";
  const businessType = customer?.businessType || client?.businessType || "Digital Services";
  const city = customer?.city || "Hyderabad";
  const state = customer?.state || "Telangana";
  const address = customer?.address || "Digitalness CR Client HQ";
  const pincode = customer?.pincode || "";
  const website = customer?.website || "";
  const activePackage = customer?.package || "Growth Enterprise 360";
  const branch = client?.branchId || customer?.branchId || "BR001 (Main HQ)";

  const openEditModal = () => {
    setEditForm({
      name: client?.name || customer?.name || "",
      phone: client?.phone || customer?.phone || customer?.contactNumbers?.[0] || "",
      companyName: customer?.companyName || customer?.name || "",
      businessType: customer?.businessType || client?.businessType || "",
      address: customer?.address || "",
      city: customer?.city || "",
      state: customer?.state || "",
      pincode: customer?.pincode || "",
      website: customer?.website || "",
      instagram: customer?.socialLinks?.instagram || customer?.instagram || "",
      facebook: customer?.socialLinks?.facebook || customer?.facebook || "",
      linkedin: customer?.socialLinks?.linkedin || customer?.linkedin || "",
    });
    setEditError("");
    setEditSuccess(false);
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    try {
      await updateProfile(editForm);
      setEditSuccess(true);
      setTimeout(() => {
        setEditSuccess(false);
        setEditModal(false);
      }, 1500);
    } catch (err) {
      setEditError(err.message || "Failed to update profile details");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => {
        setPasswordSuccess(false);
        setSecurityModal(false);
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConfirmLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Hero */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600 to-amber-400 text-slate-950 font-black text-3xl flex items-center justify-center shadow-glow shrink-0">
            {clientName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-white">{clientName}</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE CLIENT
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {clientEmail} • {clientPhone}
            </p>

            <p className="text-xs text-brand-400 font-semibold pt-1">
              {companyName} • {businessType}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <button
              onClick={() => refreshProfile()}
              disabled={profileLoading}
              title="Refresh profile from server"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${profileLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={openEditModal}
              className="px-3.5 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => setSecurityModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>

            <button
              onClick={() => setLogoutModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account & Company Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Representative Details */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-400" />
            <h3 className="text-sm font-extrabold text-white">Contact Representative</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Primary Contact</span>
              <strong className="text-white">{clientName}</strong>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Email Address</span>
              <strong className="text-white font-mono">{clientEmail}</strong>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Direct Phone</span>
              <strong className="text-white font-mono">{clientPhone}</strong>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Branch Office</span>
              <strong className="text-slate-300">{branch}</strong>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Account Access Role</span>
              <strong className="text-brand-400">Authorized Client</strong>
            </div>
          </div>
        </div>

        {/* Company & Contract Info */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white">Company & Retainer Info</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Company Name</span>
              <strong className="text-white">{companyName}</strong>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Industry / Domain</span>
              <strong className="text-slate-300">{businessType}</strong>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">City / State</span>
              <strong className="text-slate-300">{city}{state ? `, ${state}` : ""}</strong>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Active Retainer Package</span>
              <strong className="text-brand-400 font-bold">{activePackage}</strong>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Service Level Agreement</span>
              <strong className="text-emerald-400">Priority SLA Guaranteed</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Address & Digital Footprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <MapPin className="w-4 h-4 text-brand-400" />
            <span>Registered Operating Address</span>
          </div>
          <p className="text-xs text-slate-300 pl-6 leading-relaxed">
            {address}
            {pincode ? ` - ${pincode}` : ""}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Online Assets & Channels</span>
          </div>
          <div className="pl-6 space-y-1.5 text-xs text-slate-300">
            {website ? (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{website}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-500">Website not configured</span>
            )}
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
              {customer?.socialLinks?.instagram && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  IG: @{customer.socialLinks.instagram}
                </span>
              )}
              {customer?.socialLinks?.facebook && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  FB: {customer.socialLinks.facebook}
                </span>
              )}
              {customer?.socialLinks?.linkedin && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  LI: {customer.socialLinks.linkedin}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">Edit Client & Business Info</h3>
              <button
                onClick={() => setEditModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {editSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">Profile Updated!</h4>
                <p className="text-xs text-slate-400">Changes are synchronized with the CRM.</p>
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
                {editError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Company / Brand Name</label>
                    <input
                      type="text"
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Industry / Category</label>
                    <input
                      type="text"
                      value={editForm.businessType}
                      onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Office Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Website URL</label>
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow disabled:opacity-50"
                  >
                    {editLoading ? "Saving..." : "Save Live Profile"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Security & Password Modal */}
      {securityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Change Account Password</h3>

            {passwordSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-white">Password Updated!</h4>
                <p className="text-xs text-slate-400">Your security credentials have been updated.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Current Password <span className="text-slate-500 font-normal">(Optional if newly logged in)</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password if known"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-400"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSecurityModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-black text-xs shadow-glow disabled:opacity-50"
                  >
                    {passwordLoading ? "Saving..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl text-center">
            <LogOut className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-black text-white">Sign Out from Portal?</h3>
            <p className="text-xs text-slate-400">
              You will need your registered client email and password to log back in.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setLogoutModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-black hover:bg-rose-600"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
