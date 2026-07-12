import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';

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
    // Format ISO string to match datetime-local inputs (YYYY-MM-DDTHH:MM)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resource Bookings Portal</h1>
        <p className="text-slate-500 mt-1">Reserve shared hardware, meeting rooms, or lab resources without scheduling overlaps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Resources List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-semibold text-slate-800">Bookable Resources</h2>
            <p className="text-xs text-slate-400 mt-0.5">{assets.length} items available</p>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {assets.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No bookable assets found.
              </div>
            ) : (
              assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col gap-1.5 ${
                    selectedAsset?.id === asset.id ? 'bg-indigo-50/50 border-l-4 border-indigo-600 pl-3' : ''
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-semibold text-sm text-slate-800 line-clamp-1">{asset.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                      {asset.assetTag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>📍 {asset.location}</span>
                    <span>•</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Schedule & Booking Tool */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {!selectedAsset ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-2xl mb-4">
                📅
              </div>
              <h3 className="font-semibold text-slate-700 text-lg">No Resource Selected</h3>
              <p className="text-slate-400 text-sm max-w-sm mt-1">
                Please select a bookable shared resource from the sidebar directory to view its calendar schedule and reserve slot bookings.
              </p>
            </div>
          ) : (
            <>
              {/* Asset Header Info */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{selectedAsset.name}</h2>
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                      {selectedAsset.assetTag}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    📍 Location: {selectedAsset.location} | Condition: {selectedAsset.condition}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedAsset.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedAsset.status}
                  </span>
                </div>
              </div>

              {/* Booking Slot Form Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Reserve Booking Slot</h3>
                
                {error && !editingBookingId && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                    ⚠️ {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                    ✅ {success}
                  </div>
                )}

                <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={loading || !startTime || !endTime}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                    >
                      {loading ? 'Validating Slot...' : 'Confirm Reservation'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Timeline list of upcoming bookings */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">Upcoming Schedule</h3>
                
                {bookings.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No active or upcoming reservations found for this resource. Be the first to book!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => {
                      const isOwner = booking.bookedBy.id === currentUser?.id;
                      const isManager = currentUser?.role === 'Admin' || currentUser?.role === 'AssetManager';
                      const canCancel = (isOwner || isManager) && (booking.status === 'Upcoming' || booking.status === 'Ongoing');
                      const canReschedule = (isOwner || isManager) && booking.status === 'Upcoming';
                      
                      return (
                        <div
                          key={booking.id}
                          className={`p-4 rounded-xl border transition-all ${
                            booking.status === 'Cancelled' ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          {editingBookingId === booking.id ? (
                            /* Rescheduling Form Interface */
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm text-indigo-700">Reschedule Booking Slot</h4>
                              {error && (
                                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                                  ⚠️ {error}
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    New Start Date & Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={rescheduleStart}
                                    onChange={(e) => setRescheduleStart(e.target.value)}
                                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                    New End Date & Time
                                  </label>
                                  <input
                                    type="datetime-local"
                                    required
                                    value={rescheduleEnd}
                                    onChange={(e) => setRescheduleEnd(e.target.value)}
                                    className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingBookingId(null)}
                                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleReschedule(booking.id)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                                >
                                  {loading ? 'Rescheduling...' : 'Save Reschedule'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Normal View Interface */
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3.5">
                                <div className="text-xl">📅</div>
                                <div>
                                  <p className="font-semibold text-sm text-slate-800">
                                    {formatDateTime(booking.startTime)} - {formatDateTime(booking.endTime)}
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    Reserved by: {booking.bookedBy.name} ({booking.bookedBy.email})
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 justify-end">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  booking.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  booking.status === 'Cancelled' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                  'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                }`}>
                                  {booking.status}
                                </span>
                                
                                {canReschedule && (
                                  <button
                                    onClick={() => startRescheduling(booking)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-medium transition-colors"
                                  >
                                    Reschedule
                                  </button>
                                )}

                                {canCancel && (
                                  <button
                                    onClick={() => handleCancel(booking.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-medium transition-colors"
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
