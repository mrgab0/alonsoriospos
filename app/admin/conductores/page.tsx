'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  Bike,
  Car,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Edit2,
  Trash2,
  Send,
  ShieldCheck,
  PackageCheck,
  RotateCcw,
} from 'lucide-react';
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  assignDriverToOrder,
  completeDriverDelivery,
} from '@/lib/actions/driver';
import { VehicleType, DriverStatus } from '@/lib/models/Driver';

export default function AdminConductoresPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('all');

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Formulario
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('moto');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [capacityKg, setCapacityKg] = useState<number>(20);
  const [baseRate, setBaseRate] = useState<number>(5);
  const [ratePerMile, setRatePerMile] = useState<number>(1.5);
  const [status, setStatus] = useState<DriverStatus>('disponible');

  // Modal Asignar Orden
  const [assigningDriver, setAssigningDriver] = useState<any | null>(null);
  const [orderIdToAssign, setOrderIdToAssign] = useState('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getDrivers();
    if (res.success && res.data) {
      setDrivers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setEmail('');
    setVehicleType('moto');
    setVehiclePlate('');
    setVehicleModel('');
    setCapacityKg(20);
    setBaseRate(5);
    setRatePerMile(1.5);
    setStatus('disponible');
    setIsModalOpen(true);
  };

  const openEditModal = (d: any) => {
    setEditingDriver(d);
    setName(d.name || '');
    setPhone(d.phone || '');
    setEmail(d.email || '');
    setVehicleType(d.vehicleType || 'moto');
    setVehiclePlate(d.vehiclePlate || '');
    setVehicleModel(d.vehicleModel || '');
    setCapacityKg(d.capacityKg || 20);
    setBaseRate(d.baseRate || 5);
    setRatePerMile(d.ratePerMile || 1.5);
    setStatus(d.status || 'disponible');
    setIsModalOpen(true);
  };

  const handleVehicleTypeChange = (type: VehicleType) => {
    setVehicleType(type);
    if (type === 'bicicleta') {
      setCapacityKg(10);
      setBaseRate(3);
      setRatePerMile(1.0);
    } else if (type === 'moto') {
      setCapacityKg(25);
      setBaseRate(5);
      setRatePerMile(1.5);
    } else if (type === 'carro') {
      setCapacityKg(100);
      setBaseRate(8);
      setRatePerMile(2.0);
    } else if (type === 'camioneta_camion') {
      setCapacityKg(800);
      setBaseRate(25);
      setRatePerMile(3.5);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSaving(true);
    let res;
    if (editingDriver) {
      res = await updateDriver(editingDriver._id, {
        name,
        phone,
        email,
        vehicleType,
        vehiclePlate,
        vehicleModel,
        capacityKg,
        baseRate,
        ratePerMile,
        status,
      });
    } else {
      res = await createDriver({
        name,
        phone,
        email,
        vehicleType,
        vehiclePlate,
        vehicleModel,
        capacityKg,
        baseRate,
        ratePerMile,
        status,
      });
    }
    setSaving(false);

    if (res.success) {
      setIsModalOpen(false);
      setFeedback({
        type: 'success',
        message: editingDriver
          ? 'Conductor actualizado con éxito'
          : 'Nuevo conductor y vehículo incorporado a la flota',
      });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al procesar conductor' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDelete = async (id: string, driverName: string) => {
    if (!confirm(`¿Desactivar a ${driverName} de la flota activa?`)) return;
    const res = await deleteDriver(id);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Conductor retirado de la flota' });
      loadData();
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleAssignOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningDriver || !orderIdToAssign.trim()) return;

    setAssigningLoading(true);
    const res = await assignDriverToOrder(orderIdToAssign.trim(), assigningDriver._id);
    setAssigningLoading(false);

    if (res.success) {
      setAssigningDriver(null);
      setOrderIdToAssign('');
      setFeedback({
        type: 'success',
        message: `Orden #${orderIdToAssign} asignada a ${assigningDriver.name} (${assigningDriver.vehicleType})`,
      });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      alert(res.error || 'Error al asignar orden');
    }
  };

  const handleCompleteDelivery = async (d: any) => {
    if (!confirm(`¿Marcar entrega de la orden ${d.activeOrderId} como completada por ${d.name}?`))
      return;
    const res = await completeDriverDelivery(d.activeOrderId, d._id);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `¡Entrega completada! ${d.name} vuelve a estar disponible para despachos.`,
      });
      loadData();
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const getVehicleBadge = (type: VehicleType) => {
    switch (type) {
      case 'bicicleta':
        return { label: 'Bicicleta', icon: '🚲', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' };
      case 'moto':
        return { label: 'Moto Delivery', icon: '🏍️', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300' };
      case 'carro':
        return { label: 'Carro', icon: '🚗', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300' };
      case 'camioneta_camion':
        return { label: 'Camión / Flete', icon: '🚚', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' };
    }
  };

  const filtered = drivers.filter((d) => {
    const matchSearch =
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.phone?.includes(search) ||
      d.vehiclePlate?.toLowerCase().includes(search.toLowerCase());

    const matchVehicle =
      selectedVehicleFilter === 'all' || d.vehicleType === selectedVehicleFilter;

    return matchSearch && matchVehicle;
  });

  const availableCount = drivers.filter((d) => d.status === 'disponible').length;
  const inRouteCount = drivers.filter((d) => d.status === 'en_ruta').length;

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <Truck size={13} />
            <span>Logística & Despacho Multivehículo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-gray-900 dark:text-white">
            Flota de Conductores & Fletes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Administra repartidores clasificados por bicicleta, moto, carro y camionetas de carga pesada.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#163422] hover:bg-[#1E432C] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus size={16} />
            <span>Registrar Conductor / Vehículo</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE DISPONIBILIDAD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Flota Total Registrada
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {drivers.length} vehículos
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">Bicicletas, motos, autos y camiones</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Disponibles para Salida
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {availableCount} listos
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
            En base / esperando asignación
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              En Ruta / Despachando
            </span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {inRouteCount} activos
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">Con órdenes en tránsito</span>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-bold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* FILTROS POR TIPO DE TRANSPORTE Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Chips de tipo de vehículo */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Todos', icon: '🌐' },
            { id: 'bicicleta', label: 'Bicicleta', icon: '🚲' },
            { id: 'moto', label: 'Moto', icon: '🏍️' },
            { id: 'carro', label: 'Carro', icon: '🚗' },
            { id: 'camioneta_camion', label: 'Camioneta / Flete', icon: '🚚' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedVehicleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedVehicleFilter === tab.id
                  ? 'bg-[#163422] text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, placa o teléfono..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-medium focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* CUADRÍCULA DE CONDUCTORES */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="text-xs">Cargando flota de despacho...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-3">
          <Truck size={36} className="mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {search
              ? 'No se encontraron conductores con ese filtro'
              : 'Aún no has registrado conductores en tu flota'}
          </p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Registra repartidores en moto, bicicleta o fletes de camión para gestionar tus despachos locales.
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#163422] text-white text-xs font-bold hover:bg-[#1E432C]"
            >
              <Plus size={14} />
              <span>Registrar Primer Conductor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const badge = getVehicleBadge(d.vehicleType);
            const isAvailable = d.status === 'disponible';
            const isInRoute = d.status === 'en_ruta';

            return (
              <div
                key={d._id}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
              >
                <div className="space-y-3">
                  {/* Encabezado Tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                          {d.name}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border mt-0.5 ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                          : isInRoute
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {isAvailable ? 'Disponible' : isInRoute ? 'En Ruta' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Datos del Vehículo y Contacto */}
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      <span className="font-mono">{d.phone}</span>
                    </div>

                    {d.vehiclePlate && (
                      <div className="flex items-center justify-between text-[11px] bg-gray-50 dark:bg-gray-800/60 p-2 rounded-xl">
                        <span className="text-gray-400">Placa / Matrícula:</span>
                        <strong className="font-mono text-gray-900 dark:text-white uppercase">
                          {d.vehiclePlate}
                        </strong>
                      </div>
                    )}

                    {d.vehicleModel && (
                      <div className="flex items-center justify-between text-[11px] px-1">
                        <span className="text-gray-400">Modelo:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {d.vehicleModel}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] px-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400">Tarifa Flete:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        ${d.baseRate.toFixed(2)} base + ${d.ratePerMile.toFixed(2)}/milla
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] px-1">
                      <span className="text-gray-400">Capacidad:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        Hasta {d.capacityKg || 20} kg
                      </span>
                    </div>

                    {isInRoute && d.activeOrderId && (
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-[11px] font-bold flex items-center justify-between mt-2">
                        <span>Despachando Orden:</span>
                        <span className="font-mono">#{d.activeOrderId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones del Conductor */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                  {isInRoute ? (
                    <button
                      onClick={() => handleCompleteDelivery(d)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                    >
                      <PackageCheck size={14} />
                      <span>Completar Entrega</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setAssigningDriver(d)}
                      disabled={!isAvailable}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Send size={13} />
                      <span>Asignar Orden</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(d)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(d._id, d.name)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR CONDUCTOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <h3 className="font-serif font-black text-lg text-gray-900 dark:text-white">
                  {editingDriver ? 'Editar Conductor' : 'Nuevo Conductor & Vehículo'}
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
              {/* Selector de Tipo de Vehículo */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Tipo de Vehículo para Despacho
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'bicicleta', label: 'Bicicleta', icon: '🚲' },
                    { id: 'moto', label: 'Moto', icon: '🏍️' },
                    { id: 'carro', label: 'Carro', icon: '🚗' },
                    { id: 'camioneta_camion', label: 'Camión / Flete', icon: '🚚' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleVehicleTypeChange(v.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        vehicleType === v.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="text-xl">{v.icon}</span>
                      <span className="text-[10px] leading-tight">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Gómez"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Teléfono Móvil *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Placa / Matrícula</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Ej. TX-882-KL"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Modelo / Marca</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="Ej. Honda Cargo 150cc"
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>

              {/* Tarifas de Flete */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Tarifa Base ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={baseRate}
                    onChange={(e) => setBaseRate(parseFloat(e.target.value) || 0)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Por Milla ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={ratePerMile}
                    onChange={(e) => setRatePerMile(parseFloat(e.target.value) || 0)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Capacidad (kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(parseInt(e.target.value) || 20)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Disponibilidad</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 font-bold"
                >
                  <option value="disponible">Disponible (En base para despachos)</option>
                  <option value="en_ruta">En Ruta (Realizando entrega)</option>
                  <option value="inactivo">Inactivo / Fuera de Turno</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#163422] hover:bg-[#1E432C] text-white font-bold flex items-center gap-1.5"
                >
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  <span>{editingDriver ? 'Guardar Cambios' : 'Registrar Conductor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASIGNAR ORDEN */}
      {assigningDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Asignar Despacho a {assigningDriver.name}
                </h3>
              </div>
              <button
                onClick={() => setAssigningDriver(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignOrder} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs">
                <span>Vehículo asignado:</span>
                <strong className="block text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  {getVehicleBadge(assigningDriver.vehicleType).icon}{' '}
                  {getVehicleBadge(assigningDriver.vehicleType).label}
                </strong>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  N° de Orden a Despachar (ID) *
                </label>
                <input
                  type="text"
                  required
                  value={orderIdToAssign}
                  onChange={(e) => setOrderIdToAssign(e.target.value)}
                  placeholder="Ej. POS-982341 o ORD-1249"
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 font-mono text-sm"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningDriver(null)}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={assigningLoading || !orderIdToAssign.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5"
                >
                  {assigningLoading && <Loader2 size={13} className="animate-spin" />}
                  <span>Confirmar Salida en Ruta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
