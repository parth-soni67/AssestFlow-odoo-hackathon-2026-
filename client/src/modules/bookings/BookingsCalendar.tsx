import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Calendar, Clock } from 'lucide-react';

interface Asset {
  id: number;
  name: string;
  assetTag: string;
  serialNumber: string;
  condition: string;
  location: string;
  status: string;
  isBookable: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Booking {
  id: number;
  resourceAssetId: number;
  startTime: string;
  endTime: string;
  status: string;
  bookedBy: User;
}

export default function BookingsCalendar() {
  const { user: currentUser } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Create Form state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Reschedule Form state
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');

  // Status state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load bookable assets
  useEffect(() => {
    fetch('/api/v1/assets', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const list = data.assets || [];
        const bookables = list.filter((a: any) => a.isBookable);
        setAssets(bookables);
      })
      .catch(err => console.error('Error fetching bookable resources:', err));
  }, []);

  // Load bookings when selected asset changes
  const fetchBookings = (assetId: number) => {
    fetch(`/api/v1/bookings?resourceAssetId=${assetId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setBookings(data.bookings || []);
      })
      .catch(err => console.error('Error fetching schedules:', err));
  };

  useEffect(() => {
    if (selectedAsset) {
      fetchBookings(selectedAsset.id);
      setError(null);
      setSuccess(null);
      setEditingBookingId(null);
    }
  }, [selectedAsset]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          resourceAssetId: selectedAsset.id,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 'BOOKING_OVERLAP') {
          const conf = data.error.details?.conflictingBooking;
          const userStr = conf?.bookedBy ? `${conf.bookedBy.name} (${conf.bookedBy.email})` : 'another user';
          throw new Error(`Time slot conflict: Overlaps with booking by ${userStr} from ${new Date(conf?.startTime).toLocaleString()} to ${new Date(conf?.endTime).toLocaleString()}`);
        }
        throw new Error(data.error?.message || 'Failed to complete booking.');
      }

      setSuccess('Booking reserved successfully!');
      setStartTime('');
      setEndTime('');
      fetchBookings(selectedAsset.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to cancel reservation.');
      }

      setSuccess('Reservation cancelled successfully!');
      if (selectedAsset) fetchBookings(selectedAsset.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startRescheduling = (booking: Booking) => {
    const startLocal = new Date(booking.startTime).toISOString().slice(0, 16);
    const endLocal = new Date(booking.endTime).toISOString().slice(0, 16);
    
    setRescheduleStart(startLocal);
    setRescheduleEnd(endLocal);
    setEditingBookingId(booking.id);
    setError(null);
    setSuccess(null);
  };

  const handleReschedule = async (bookingId: number) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          startTime: new Date(rescheduleStart).toISOString(),
          endTime: new Date(rescheduleEnd).toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.code === 'BOOKING_OVERLAP') {
          const conf = data.error.details?.conflictingBooking;
          const userStr = conf?.bookedBy ? `${conf.bookedBy.name} (${conf.bookedBy.email})` : 'another user';
          throw new Error(`Time slot conflict: Overlaps with booking by ${userStr} from ${new Date(conf?.startTime).toLocaleString()} to ${new Date(conf?.endTime).toLocaleString()}`);
        }
        throw new Error(data.error?.message || 'Failed to reschedule booking.');
      }

      setSuccess('Booking rescheduled successfully!');
      setEditingBookingId(null);
      if (selectedAsset) fetchBookings(selectedAsset.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-success-subtle text-success border-success/25';
      case 'Allocated': return 'bg-info-subtle text-info border-info/25';
      case 'Reserved': return 'bg-warning-subtle text-warning border-warning/25';
      case 'UnderMaintenance': return 'bg-alert-subtle text-alert border-alert/25';
      case 'Lost': return 'bg-danger-subtle text-danger border-danger/25';
      default: return 'bg-neutral-subtle text-neutral-status border-border';
    }
  };

  return (
    <div className="space-y-24 font-sans text-text-primary">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Resource Bookings Portal</h1>
        <p className="text-sm text-text-secondary">Reserve shared hardware, meeting rooms, or lab resources without scheduling overlaps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-24">
        {/* Left Column: Resources List */}
        <div className="lg:col-span-1 bg-surface rounded border border-border overflow-hidden flex flex-col">
          <div className="p-16 border-b border-border bg-surface-sunken">
            <h2 className="text-sm font-bold text-text-primary">Bookable Resources</h2>
            <p className="text-xs text-text-muted mt-4">{assets.length} items available</p>
          </div>
          <div className="divide-y divide-border overflow-y-auto max-h-[600px] bg-surface">
            {assets.length === 0 ? (
              <div className="p-24 text-center text-xs text-text-muted">
                No bookable assets found.
              </div>
            ) : (
              assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`w-full text-left p-16 hover:bg-surface-sunken transition-all flex flex-col gap-8 border-l-4 ${
                    selectedAsset?.id === asset.id 
                      ? 'bg-accent-subtle border-accent pl-12' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-semibold text-xs text-text-primary line-clamp-1">{asset.name}</span>
                    <span className="text-[10px] font-mono px-8 py-2 bg-surface border border-border text-text-secondary rounded">
                      {asset.assetTag}
                    </span>
                  </div>
                  <div className="flex items-center gap-8 text-xs text-text-secondary">
                    <span>📍 {asset.location}</span>
                    <span>•</span>
                    <span className={`px-8 py-2 rounded-badge text-[10px] font-bold border ${getStatusBadgeClass(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Schedule & Booking Tool */}
        <div className="lg:col-span-3 flex flex-col gap-24">
          {!selectedAsset ? (
            <div className="bg-surface rounded border border-border p-48 text-center flex flex-col items-center justify-center min-h-[400px]">
              <Calendar className="w-32 h-32 text-text-muted mb-16" />
              <h3 className="font-bold text-text-primary text-sm">No Resource Selected</h3>
              <p className="text-text-secondary text-xs max-w-sm mt-4">
                Please select a bookable shared resource from the sidebar directory to view its calendar schedule and reserve slot bookings.
              </p>
            </div>
          ) : (
            <>
              {/* Asset Header Info */}
              <div className="bg-surface rounded border border-border p-24 flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
                <div>
                  <div className="flex items-center gap-12">
                    <h2 className="text-lg font-bold text-text-primary">{selectedAsset.name}</h2>
                    <span className="text-xs font-mono px-8 py-2 bg-surface-sunken text-text-secondary rounded border border-border">
                      {selectedAsset.assetTag}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-8">
                    📍 Location: {selectedAsset.location} | Condition: {selectedAsset.condition}
                  </p>
                </div>
                <div>
                  <span className={`px-12 py-4 rounded-badge text-xs font-semibold border ${getStatusBadgeClass(selectedAsset.status)}`}>
                    {selectedAsset.status}
                  </span>
                </div>
              </div>

              {/* Booking Slot Form Card */}
              <div className="bg-surface rounded border border-border p-24">
                <h3 className="font-bold text-text-primary border-b border-border pb-12 mb-16 text-sm">Reserve Booking Slot</h3>
                
                {error && !editingBookingId && (
                  <div className="mb-16 p-12 bg-danger-subtle border border-danger/25 rounded text-xs text-danger">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="mb-16 p-12 bg-success-subtle border border-success/25 rounded text-xs text-success">
                    ✅ {success}
                  </div>
                )}

                <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-3 gap-16 items-end">
                  <div className="space-y-8">
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-32 rounded border border-border px-12 text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-8">
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-premium w-full h-32"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={loading || !startTime || !endTime}
                      className="w-full h-32 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-sm font-semibold text-xs transition-colors shadow-sm btn-premium"
                    >
                      {loading ? 'Validating Slot...' : 'Confirm Reservation'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Timeline list of upcoming bookings */}
              <div className="card-premium p-24">
                <h3 className="font-bold text-text-primary border-b border-border/60 pb-12 mb-16 text-sm">Upcoming Schedule</h3>
                
                {bookings.length === 0 ? (
                  <div className="p-32 text-center text-text-muted text-xs">
                    No active or upcoming reservations found for this resource. Be the first to book!
                  </div>
                ) : (
                  <div className="space-y-12">
                    {bookings.map((booking) => {
                      const isOwner = booking.bookedBy.id === currentUser?.id;
                      const isManager = currentUser?.role === 'Admin' || currentUser?.role === 'AssetManager';
                      const canCancel = (isOwner || isManager) && (booking.status === 'Upcoming' || booking.status === 'Ongoing');
                      const canReschedule = (isOwner || isManager) && booking.status === 'Upcoming';
                      
                      return (
                        <div
                          key={booking.id}
                          className={`p-16 rounded-sm border transition-all animate-scale-up ${
                            booking.status === 'Cancelled' ? 'bg-surface border-border/40 opacity-50' : 'bg-surface-sunken border-border'
                          }`}
                        >
                          {editingBookingId === booking.id ? (
                            /* Rescheduling Form Interface */
                            <div className="space-y-16">
                              <h4 className="font-semibold text-xs text-accent">Reschedule Booking Slot</h4>
                              {error && (
                                <div className="p-12 bg-danger-subtle border border-danger/25 rounded text-xs text-danger">
                                  ⚠️ {error}
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                <div className="space-y-8">
                                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                    New Start Date & Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={rescheduleStart}
                                    onChange={(e) => setRescheduleStart(e.target.value)}
                                    className="input-premium w-full h-32"
                                  />
                                </div>
                                <div className="space-y-8">
                                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                    New End Date & Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={rescheduleEnd}
                                    onChange={(e) => setRescheduleEnd(e.target.value)}
                                    className="input-premium w-full h-32"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-8 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingBookingId(null)}
                                  className="px-12 py-8 bg-surface border border-border text-text-secondary rounded-sm text-xs font-semibold hover:bg-surface-sunken btn-premium"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleReschedule(booking.id)}
                                  className="px-12 py-8 bg-accent hover:bg-accent-hover text-white rounded-sm text-xs font-semibold btn-premium"
                                >
                                  {loading ? 'Rescheduling...' : 'Save Reschedule'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Normal View Interface */
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
                              <div className="flex items-center gap-12">
                                <Clock className="w-20 h-20 text-text-muted" />
                                <div>
                                  <p className="font-semibold text-xs text-text-primary">
                                    {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                                  </p>
                                  <p className="text-xs text-text-muted mt-4">
                                    Reserved by: {booking.bookedBy.name} ({booking.bookedBy.email})
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-12 justify-end">
                                <span className={`px-8 py-2 rounded-badge text-[10px] font-semibold border ${
                                  booking.status === 'Upcoming' ? 'bg-info-subtle text-info border-info/20' :
                                  booking.status === 'Cancelled' ? 'bg-neutral-subtle text-neutral-status border border-border' :
                                  'bg-accent-subtle text-accent border border-accent/20'
                                }`}>
                                  {booking.status}
                                </span>
                                
                                {canReschedule && (
                                  <button
                                    onClick={() => startRescheduling(booking)}
                                    className="px-12 py-6 bg-surface hover:bg-surface-sunken text-text-secondary rounded-sm border border-border text-xs font-medium transition-colors btn-premium"
                                  >
                                    Reschedule
                                  </button>
                                )}

                                {canCancel && (
                                  <button
                                    onClick={() => handleCancel(booking.id)}
                                    className="px-12 py-6 bg-danger-subtle hover:bg-danger/10 text-danger rounded-sm border border-danger/25 text-xs font-medium transition-colors btn-premium"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
