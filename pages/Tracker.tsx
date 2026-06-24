import { useState, useEffect } from 'react';
import { MapPin, Navigation, Plus, Clock, Trash2, MapPinned, Search, AlertCircle, Check } from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn, uid, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

interface ParkingData {
  lat: number;
  lng: number;
  address?: string;
  timestamp: number;
  manualAddress?: string;
}

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  category: 'home' | 'work' | 'frequent' | 'custom';
  createdAt: number;
}

interface LocationHistoryItem {
  id: string;
  name: string;
  address: string;
  timestamp: number;
}

interface TrackedItem {
  id: string;
  name: string;
  location: string;
  notes?: string;
  timestamp: number;
}

export default function Tracker() {
  const { t } = useLanguage();
  const [parking, setParking] = useLocalStorage<ParkingData | null>('companion_parking', null);
  const [savedLocations, setSavedLocations] = useLocalStorage<SavedLocation[]>('companion_saved_locations', []);
  const [locationHistory, setLocationHistory] = useLocalStorage<LocationHistoryItem[]>('companion_location_history', []);
  const [trackedItems, setTrackedItems] = useLocalStorage<TrackedItem[]>('companion_tracked_items', []);
  const [permissions] = useLocalStorage<{ health: boolean; calendar: boolean; email: boolean; location: boolean; ai: boolean }>('companion_permissions', { health: false, calendar: false, email: false, location: false, ai: true });

  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [showAddLocation, setShowAddLocation] = useState(false);

  const [newItemName, setNewItemName] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);

  useEffect(() => {
    const item = sessionStorage.getItem('companion_track_item');
    if (item) {
      setNewItemName(item);
      setShowAddItem(true);
      sessionStorage.removeItem('companion_track_item');
    }
  }, []);

  function saveParking() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setParking({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        });
        toast.success('Location saved!');
      },
      () => {
        toast.error('Could not get location. Please enable GPS.');
      }
    );
  }

  function addSavedLocation() {
    if (!newLocationName.trim() || !newLocationAddress.trim()) return;
    const loc: SavedLocation = {
      id: uid(),
      name: newLocationName,
      address: newLocationAddress,
      category: 'custom',
      createdAt: Date.now(),
    };
    setSavedLocations(prev => [...prev, loc]);
    setNewLocationName('');
    setNewLocationAddress('');
    setShowAddLocation(false);
    toast.success('Location saved!');
  }

  function deleteSavedLocation(id: string) {
    setSavedLocations(prev => prev.filter(l => l.id !== id));
  }

  function addTrackedItem() {
    if (!newItemName.trim() || !newItemLocation.trim()) return;
    const item: TrackedItem = {
      id: uid(),
      name: newItemName,
      location: newItemLocation,
      timestamp: Date.now(),
    };
    setTrackedItems(prev => [...prev, item]);
    setNewItemName('');
    setNewItemLocation('');
    setShowAddItem(false);
    toast.success(`Tracking your ${item.name}!`);
  }

  function deleteTrackedItem(id: string) {
    setTrackedItems(prev => prev.filter(i => i.id !== id));
  }

  function clearParking() {
    setParking(null);
    toast.success('Parking location cleared');
  }

  const locationEnabled = permissions?.location ?? false;

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('tracker')} backTo="/" />

      <div className="px-4 py-4 space-y-5">
        {/* Location permission prompt */}
        {!locationEnabled && (
          <Card className="border-[hsl(35_25%_88%)] bg-[hsl(40_30%_98%)]">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-[hsl(35_70%_55%)] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t('location_disabled_title')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('location_disabled_desc')}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 text-xs"
                    onClick={() => toast.info('Go to Settings > Privacy to enable location permissions')}
                  >
                    {t('enable_location')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Parked Location */}
        <Card className="border-[hsl(35_25%_88%)] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MapPinned size={14} className="text-[var(--brand-accent)]" />
                {t('last_parked')}
              </p>
              {parking && (
                <button
                  onClick={clearParking}
                  className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                >
                  {t('clear')}
                </button>
              )}
            </div>

            {parking ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[hsl(40_20%_97%)]">
                  <MapPin size={16} className="text-[var(--brand-accent)] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {parking.manualAddress || parking.address || `${parking.lat.toFixed(4)}, ${parking.lng.toFixed(4)}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(parking.timestamp)}</p>
                  </div>
                </div>
                <Button
                  onClick={saveParking}
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs"
                >
                  <Navigation size={14} className="mr-1.5" />
                  {t('update_location')}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[hsl(40_20%_95%)] flex items-center justify-center mx-auto mb-2">
                  <MapPin size={24} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">{t('no_parking')}</p>
                <Button
                  onClick={saveParking}
                  size="sm"
                  className="h-9 px-4 bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0"
                >
                  <Plus size={14} className="mr-1.5" />
                  {t('save_current_location')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Find My Items */}
        <Card className="border-[hsl(35_25%_88%)] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Search size={14} className="text-[var(--brand-accent)]" />
                {t('find_my_items')}
              </p>
              <button
                onClick={() => setShowAddItem(v => !v)}
                className="text-xs text-[hsl(150_25%_40%)] flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> {t('add')}
              </button>
            </div>

            {showAddItem && (
              <div className="space-y-2 mb-3 p-3 rounded-xl bg-[hsl(40_20%_97%)]">
                <Input
                  placeholder={t('item_name_placeholder')}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder={t('item_location_placeholder')}
                  value={newItemLocation}
                  onChange={e => setNewItemLocation(e.target.value)}
                  className="h-9 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addTrackedItem}
                    disabled={!newItemName.trim() || !newItemLocation.trim()}
                    className="flex-1 h-8 text-xs bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] border-0"
                  >
                    <Check size={12} className="mr-1" /> {t('save')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddItem(false)}
                    className="h-8 text-xs"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            )}

            {trackedItems.length > 0 ? (
              <div className="space-y-2">
                {trackedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-2.5 rounded-xl bg-[hsl(40_20%_97%)]"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base mt-0.5">🔍</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTrackedItem(item.id)}
                      className="text-muted-foreground hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">{t('no_tracked_items')}</p>
            )}
          </CardContent>
        </Card>

        {/* Saved Locations */}
        <Card className="border-[hsl(35_25%_88%)] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MapPin size={14} className="text-[var(--brand-accent)]" />
                {t('saved_locations')}
              </p>
              <button
                onClick={() => setShowAddLocation(v => !v)}
                className="text-xs text-[hsl(150_25%_40%)] flex items-center gap-1 hover:underline"
              >
                <Plus size={12} /> {t('add')}
              </button>
            </div>

            {showAddLocation && (
              <div className="space-y-2 mb-3 p-3 rounded-xl bg-[hsl(40_20%_97%)]">
                <Input
                  placeholder={t('location_name_placeholder')}
                  value={newLocationName}
                  onChange={e => setNewLocationName(e.target.value)}
                  className="h-9 text-sm"
                />
                <Input
                  placeholder={t('address_placeholder')}
                  value={newLocationAddress}
                  onChange={e => setNewLocationAddress(e.target.value)}
                  className="h-9 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={addSavedLocation}
                    disabled={!newLocationName.trim() || !newLocationAddress.trim()}
                    className="flex-1 h-8 text-xs bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] border-0"
                  >
                    <Check size={12} className="mr-1" /> {t('save')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddLocation(false)}
                    className="h-8 text-xs"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            )}

            {savedLocations.length > 0 ? (
              <div className="space-y-2">
                {savedLocations.map(loc => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[hsl(40_20%_97%)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {loc.category === 'home' ? '🏠' : loc.category === 'work' ? '💼' : '📍'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{loc.name}</p>
                        <p className="text-xs text-muted-foreground">{loc.address}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSavedLocation(loc.id)}
                      className="text-muted-foreground hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">{t('no_saved_locations')}</p>
            )}
          </CardContent>
        </Card>

        {/* Location History */}
        {locationHistory.length > 0 && (
          <Card className="border-[hsl(35_25%_88%)] shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Clock size={14} className="text-muted-foreground" />
                  {t('location_history')}
                </p>
                <button
                  onClick={() => setLocationHistory([])}
                  className="text-xs text-muted-foreground hover:text-red-400"
                >
                  {t('clear_all')}
                </button>
              </div>
              <div className="space-y-2">
                {locationHistory.slice(0, 10).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(40_20%_97%)]"
                  >
                    <MapPin size={12} className="text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
