'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  PackagePlus,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/actions/supplier';

export default function AdminProveedoresPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    creditTermsDays: 0,
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    const res = await getSuppliers();
    if (res.success && res.data) {
      setSuppliers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      taxId: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      creditTermsDays: 0,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      taxId: supplier.taxId || '',
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      creditTermsDays: supplier.creditTermsDays || 0,
      notes: supplier.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    let res;
    if (editingSupplier) {
      res = await updateSupplier(editingSupplier._id, formData);
    } else {
      res = await createSupplier(formData);
    }
    setSaving(false);

    if (res.success) {
      setIsModalOpen(false);
      setFeedback({
        type: 'success',
        message: editingSupplier
          ? 'Proveedor actualizado correctamente'
          : 'Proveedor creado con éxito',
      });
      setTimeout(() => setFeedback(null), 4000);
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al procesar solicitud' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de desactivar al proveedor "${name}"?`)) return;
    const res = await deleteSupplier(id);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Proveedor desactivado' });
      setTimeout(() => setFeedback(null), 3000);
      loadData();
    } else {
      alert('Error al desactivar proveedor');
    }
  };

  const filtered = suppliers.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.taxId?.toLowerCase().includes(term) ||
      s.contactName?.toLowerCase().includes(term)
    );
  });

  const totalPendingDebt = suppliers.reduce((acc, s) => acc + (s.balancePending || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <Building2 size={13} />
            <span>Módulo de Compras & Proveedores</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 dark:text-white">
            Directorio de Proveedores
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Gestiona empresas suministradoras, condiciones de crédito y saldos por pagar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/compras"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <PackagePlus size={16} className="text-emerald-500" />
            <span>Recepcionar Mercancía</span>
          </Link>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#163422] hover:bg-[#1E432C] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus size={16} />
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* BANNER DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Proveedores Activos
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {suppliers.length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Deuda Total por Pagar a Proveedores
          </span>
          <span
            className={`text-2xl font-black mt-1 block ${
              totalPendingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
            }`}
          >
            ${totalPendingDebt.toFixed(2)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Entrada de Mercancía
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-1 block">
              Kardex & Stock en tiempo real
            </span>
          </div>
          <Link
            href="/admin/compras"
            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
          >
            Registrar Factura →
          </Link>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar proveedor por nombre, RIF/taxId o persona de contacto..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-medium focus:outline-none focus:border-blue-500 dark:text-white"
        />
      </div>

      {/* LISTA DE PROVEEDORES */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="text-xs">Cargando directorio de proveedores...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
          <Building2 size={36} className="mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {search ? 'No se encontraron proveedores coincidentes' : 'Aún no has registrado proveedores'}
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Agrega las empresas que te suministran mercancía para controlar compras, inventario y cuentas pendientes.
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#163422] text-white text-xs font-bold hover:bg-[#1E432C]"
            >
              <Plus size={14} />
              <span>Registrar Primer Proveedor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((supplier) => (
            <div
              key={supplier._id}
              className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-700 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                      {supplier.name}
                    </h3>
                    {supplier.taxId && (
                      <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                        RIF / Tax: {supplier.taxId}
                      </span>
                    )}
                  </div>
                  {supplier.balancePending > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold whitespace-nowrap">
                      Debe: ${supplier.balancePending.toFixed(2)}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold whitespace-nowrap">
                      Al día
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {supplier.contactName && (
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-gray-400 shrink-0" />
                      <span>{supplier.contactName}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Clock size={13} className="text-gray-400 shrink-0" />
                    <span>
                      Crédito:{' '}
                      <strong className="text-gray-700 dark:text-gray-300">
                        {supplier.creditTermsDays > 0 ? `${supplier.creditTermsDays} días` : 'Contado'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* ACCIONES DE PROVEEDOR */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                <Link
                  href={`/admin/compras?supplierId=${supplier._id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <PackagePlus size={13} />
                  <span>Comprar</span>
                </Link>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier._id, supplier.name)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR PROVEEDOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <h3 className="font-serif font-black text-lg text-gray-900 dark:text-white">
                  {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Nombre o Razón Social <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Distribuidora Central C.A."
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">RIF / Tax ID</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="Ej. J-12345678-9"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Persona de Contacto</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ventas@proveedor.com"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">
                    Días de Crédito (0 = Contado)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditTermsDays}
                    onChange={(e) =>
                      setFormData({ ...formData, creditTermsDays: Number(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle, Ciudad, Zona Industrial..."
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Observaciones o Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles sobre entregas, cuenta bancaria para transferencias, etc."
                  rows={2}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#163422] hover:bg-[#1E432C] text-white font-bold flex items-center gap-1.5"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  <span>{editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
