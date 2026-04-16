import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { useToast } from "../../components/ui/Toast";
import * as db from "../../services/db";
import type { Product, ProductPricing } from "../../types/index";

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  // Array management for features
  const [featureInput, setFeatureInput] = useState("");

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    features: [],
    category: "LinkedIn",
    popular: false,
    isActive: true,
    acceptsPreOrders: true,
    pricing: [{
      durationMonths: 1,
      priceUSD: 0, priceGBP: 0, priceEUR: 0,
      oldPriceUSD: 0, oldPriceGBP: 0, oldPriceEUR: 0,
      isDisabled: false,
      tierNote: ''
    }],
  });

  useEffect(() => {
    if (isEditing && id) {
      loadProduct(id);
    }
  }, [id, isEditing]);

  const loadProduct = async (productId: string) => {
    try {
      const product = await db.getProduct(productId);
      if (product) {
        // Handle migration from legacy single-pricing to array
        let pricing = product.pricing || [];
        if (pricing.length === 0 && (product as any).price !== undefined) {
          pricing = [{
            durationMonths: (product as any).durationMonths || 1,
            priceUSD: (product as any).price || 0,
            priceGBP: (product as any).price || 0,
            priceEUR: (product as any).price || 0,
            oldPriceUSD: (product as any).oldPrice || 0,
            oldPriceGBP: (product as any).oldPrice || 0,
            oldPriceEUR: (product as any).oldPrice || 0
          }];
        }
        if (pricing.length === 0) {
          pricing = [{
            durationMonths: 1,
            priceUSD: 0, priceGBP: 0, priceEUR: 0,
            oldPriceUSD: 0, oldPriceGBP: 0, oldPriceEUR: 0
          }];
        }
        setFormData({
          ...product,
          pricing,
          isActive: product.isActive ?? true,
          acceptsPreOrders: product.acceptsPreOrders ?? true
        });
      } else {
        showToast("Product not found", "error");
        navigate("/unlock-world-26/products");
      }
    } catch (error) {
      console.error("Failed to load product:", error);
      showToast("Failed to load product", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePricingChange = (index: number, field: keyof ProductPricing, value: string | number | boolean) => {
    setFormData(prev => {
      const newPricing = [...(prev.pricing || [])];
      newPricing[index] = { ...newPricing[index], [field]: value };
      return { ...prev, pricing: newPricing };
    });
  };

  const addPricingTier = () => {
    setFormData(prev => ({
      ...prev,
      pricing: [...(prev.pricing || []), {
        durationMonths: 1,
        priceUSD: 0, priceGBP: 0, priceEUR: 0,
        oldPriceUSD: 0, oldPriceGBP: 0, oldPriceEUR: 0,
        isDisabled: false,
        tierNote: ''
      }]
    }));
  };

  const removePricingTier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pricing: (prev.pricing || []).filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()]
      }));
      setFeatureInput("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!formData.pricing || formData.pricing.length === 0) {
        showToast("Please add at least one pricing tier.", "error");
        setIsSaving(false);
        return;
      }

      // Automatically set lowest price/duration for backward compatibility/quick sorting
      const sortedPricing = [...formData.pricing].sort((a, b) => a.priceUSD - b.priceUSD);
      const basePricing = sortedPricing[0];

      const productToSave: Product = {
        id: isEditing && id ? id : `prod_${Date.now()}`,
        name: formData.name || "",
        description: formData.description || "",
        features: formData.features || [],
        category: formData.category || "LinkedIn",
        popular: formData.popular || false,
        isActive: formData.isActive ?? true,
        acceptsPreOrders: formData.acceptsPreOrders ?? true,
        pricing: formData.pricing,
        // Sync legacy fields with the lowest base tier (using USD as base)
        price: basePricing.priceUSD,
        oldPrice: basePricing.oldPriceUSD,
        durationMonths: basePricing.durationMonths,
      };

      await db.saveProduct(productToSave);
      showToast(isEditing ? "Product updated successfully" : "Product created successfully", "success");
      navigate("/unlock-world-26/products");
    } catch (error) {
      console.error("Failed to save product:", error);
      showToast("Failed to save product. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/unlock-world-26/products")}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? "Edit Product" : "New Product"}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {isEditing ? "Update product details and pricing" : "Add a new product to the catalog"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    placeholder="e.g., LinkedIn Premium Career (12 Months)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 resize-none"
                    placeholder="Brief description of the product benefits..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Subscription Options */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pricing Options (Durations)</h3>
                <button
                  type="button"
                  onClick={addPricingTier}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tier
                </button>
              </div>

              {(formData.pricing || []).map((tier, index) => (
                <div
                  key={index}
                  className={`flex flex-wrap items-end gap-4 p-4 border rounded-xl relative group transition-colors ${
                    tier.isDisabled
                      ? 'bg-rose-50/40 border-slate-200 border-l-4 border-l-rose-400'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removePricingTier(index)}
                      className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-full p-1 shadow-sm transition opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Duration (Months) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={tier.durationMonths || ''}
                      onChange={(e) => handlePricingChange(index, 'durationMonths', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    />
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Price USD ($) *</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Retail"
                        value={tier.oldPriceUSD || ''}
                        onChange={(e) => handlePricingChange(index, 'oldPriceUSD', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-400 line-through"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Sale"
                        required
                        value={tier.priceUSD || ''}
                        onChange={(e) => handlePricingChange(index, 'priceUSD', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-indigo-700 bg-indigo-50/50"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Price GBP (£) *</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Retail"
                        value={tier.oldPriceGBP || ''}
                        onChange={(e) => handlePricingChange(index, 'oldPriceGBP', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-400 line-through"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Sale"
                        required
                        value={tier.priceGBP || ''}
                        onChange={(e) => handlePricingChange(index, 'priceGBP', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-indigo-700 bg-emerald-50/50"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Price EUR (€) *</label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Retail"
                        value={tier.oldPriceEUR || ''}
                        onChange={(e) => handlePricingChange(index, 'oldPriceEUR', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-400 line-through"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Sale"
                        required
                        value={tier.priceEUR || ''}
                        onChange={(e) => handlePricingChange(index, 'priceEUR', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-indigo-700 bg-amber-50/50"
                      />
                    </div>
                  </div>

                  {/* Tier Note + Unavailable toggle — full width row */}
                  <div className="w-full flex items-end gap-4 pt-3 mt-1 border-t border-slate-200">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">
                        Tier Note <span className="font-normal text-slate-400">(optional — shown to customers when this tier is selected)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. New accounts only · Max 60 chars"
                        maxLength={80}
                        value={tier.tierNote || ''}
                        onChange={(e) => handlePricingChange(index, 'tierNote', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-900"
                      />
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer pb-1 flex-shrink-0">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={tier.isDisabled || false}
                          onChange={(e) => handlePricingChange(index, 'isDisabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-rose-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </div>
                      <span className="text-sm font-bold text-slate-600 whitespace-nowrap">Mark Unavailable</span>
                    </label>
                  </div>
                </div>
              ))}

              {(!formData.pricing || formData.pricing.length === 0) && (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-400 text-sm">No pricing tiers added. You must add at least one.</p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Features List</h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  placeholder="Add a feature (e.g., Unlimited InMails)..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {formData.features && formData.features.length > 0 && (
                <ul className="space-y-2 mt-4">
                  {formData.features.map((feature, index) => (
                    <li key={index} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Flags */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Display Options</h3>
              <div className="flex flex-wrap gap-8">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition">Active (Visible in store)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="popular"
                      checked={formData.popular}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition mb-0">Highlight as "Popular"</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      name="acceptsPreOrders"
                      checked={formData.acceptsPreOrders}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition mb-0">Allow Pre-Orders (Orderable at 0 stock)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/unlock-world-26/products")}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
