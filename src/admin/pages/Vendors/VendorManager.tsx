import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, FileText, Trash2, Edit, Save, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import * as db from '../../services/db';
import { Vendor } from '../../types';

export function VendorManager() {
  const { showToast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: '',
    email: '',
    contactNumber: '',
    note: ''
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const data = await db.getVendors();
      setVendors(data);
    } catch (error) {
      console.error("Failed to load vendors:", error);
      showToast("Failed to sync vendors", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData(vendor);
    } else {
      setEditingVendor(null);
      setFormData({ name: '', email: '', contactNumber: '', note: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast("Vendor Name is required", "error");
      return;
    }

    const vendorId = editingVendor?.id || `v_${Date.now()}`;
    const vendor: Vendor = {
      ...(formData as Vendor),
      id: vendorId,
      createdAt: editingVendor?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await db.saveVendor(vendor);
      showToast(`Vendor ${editingVendor ? 'updated' : 'created'} successfully`, "success");
      setIsModalOpen(false);
      loadVendors();
    } catch (error) {
      console.error("Failed to save vendor:", error);
      showToast("Sync failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await db.deleteVendor(id);
      showToast("Vendor deleted", "success");
      loadVendors();
    } catch (error) {
      showToast("Failed to delete", "error");
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.contactNumber.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Vendor Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your suppliers and service providers.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New Vendor
        </button>
      </div>

      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search vendors by name, email, or contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border-none focus:ring-0 text-sm font-medium text-slate-900 placeholder:text-slate-300 bg-transparent"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="responsive-table-container">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Added On</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-600">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading vendors...</td></tr>
              ) : filteredVendors.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No vendors found.</td></tr>
              ) : filteredVendors.map(vendor => (
                <tr key={vendor.id} className="hover:bg-slate-50/30 transition-colors group text-xs">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm">{vendor.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-tight">{vendor.id}</div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3 h-3 text-slate-300" />
                      {vendor.email || '—'}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3 h-3 text-slate-300" />
                      {vendor.contactNumber || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate">
                    <div className="flex items-center gap-2">
                       <FileText className="w-3 h-3 text-slate-300 flex-shrink-0" />
                       <span className="italic text-slate-400 font-normal">{vendor.note || 'No notes added'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(vendor)}
                        className="p-2 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Vendor"
                      >
                        <Edit className="w-3.5 h-3.5 text-indigo-500" />
                      </button>
                      <button 
                        onClick={() => handleDelete(vendor.id)}
                        className="p-2 hover:bg-rose-50 rounded-xl transition-all"
                        title="Delete Vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 overflow-hidden relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vendor Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold placeholder:text-slate-300"
                    placeholder="e.g. Premium Suppliers Ltd"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold placeholder:text-slate-300 text-slate-900"
                      placeholder="vendor@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                    <input 
                      type="text" 
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold placeholder:text-slate-300 text-slate-900"
                      placeholder="+233..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Internal Info</label>
                  <textarea 
                    rows={4}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-bold placeholder:text-slate-300 resize-none text-slate-900"
                    placeholder="Provide any additional details about this vendor..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingVendor ? 'Save Changes' : 'Create Vendor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
