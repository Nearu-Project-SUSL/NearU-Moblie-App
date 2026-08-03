/**
 * RideMap — Google Maps component for the NearU Rides section.
 *
 * Features:
 * - Pickup pin (cyan/NearU accent)
 * - Dropoff pin (red)
 * - Live rider pin (pulsing dot)
 * - Route polyline connecting pickup ↔ dropoff
 * - Auto-fit camera to show all markers
 */

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Colors } from '../../constants/Colors';
import { LatLng } from '../../types/rides';
import { Navigation, MapPin, CircleDot } from 'lucide-react-native';

interface RideMapProps {
  pickup?: LatLng;
  dropoff?: LatLng;
  riderLocation?: LatLng;
  showRoute?: boolean;
  style?: object;
  /** If true, camera auto-fits to show all markers */
  autoFit?: boolean;
}

export default function RideMap({
  pickup,
  dropoff,
  riderLocation,
  showRoute = true,
  style,
  autoFit = true,
}: RideMapProps) {
  const mapRef = useRef<MapView>(null);
  const scheme = useColorScheme() ?? 'light';

  // Build list of all visible coordinates for camera fitting
  const visibleCoords: LatLng[] = [pickup, dropoff, riderLocation].filter(Boolean) as LatLng[];

  useEffect(() => {
    if (!autoFit || !mapRef.current || visibleCoords.length === 0) return;

    // Small delay to let map render before fitting
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(visibleCoords, {
        edgePadding: { top: 80, right: 60, bottom: 200, left: 60 },
        animated: true,
      });
    }, 300);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude, riderLocation?.latitude]);

  // Default region centred on SUSL if no coordinates yet
  const defaultRegion: Region = {
    latitude: 6.7146,
    longitude: 80.7872,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  };

  const routeCoords: LatLng[] =
    showRoute && pickup && dropoff ? [pickup, dropoff] : [];

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={[styles.map, style]}
      initialRegion={defaultRegion}
      customMapStyle={scheme === 'dark' ? darkMapStyle : []}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={false}
      showsTraffic={false}
      toolbarEnabled={false}
    >
      {/* ── Pickup marker ───────────────────────────────────── */}
      {pickup && (
        <Marker coordinate={pickup} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.markerWrapper}>
            <View style={[styles.markerPin, { backgroundColor: Colors.brand.accent }]}>
              <MapPin size={14} color="#FFFFFF" />
            </View>
            <View style={[styles.markerTail, { borderTopColor: Colors.brand.accent }]} />
          </View>
        </Marker>
      )}

      {/* ── Dropoff marker ──────────────────────────────────── */}
      {dropoff && (
        <Marker coordinate={dropoff} anchor={{ x: 0.5, y: 1 }}>
          <View style={styles.markerWrapper}>
            <View style={[styles.markerPin, { backgroundColor: '#EF4444' }]}>
              <MapPin size={14} color="#FFFFFF" />
            </View>
            <View style={[styles.markerTail, { borderTopColor: '#EF4444' }]} />
          </View>
        </Marker>
      )}

      {/* ── Rider live-location marker ───────────────────────── */}
      {riderLocation && (
        <Marker coordinate={riderLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.riderMarker}>
            <View style={styles.riderPulse} />
            <View style={[styles.riderDot, { backgroundColor: Colors.brand.accent }]}>
              <Navigation size={10} color="#FFFFFF" />
            </View>
          </View>
        </Marker>
      )}

      {/* ── Route polyline ───────────────────────────────────── */}
      {routeCoords.length === 2 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor={Colors.brand.accent}
          strokeWidth={3}
          lineDashPattern={[8, 4]}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerWrapper: {
    alignItems: 'center',
  },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  riderMarker: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.accent,
    opacity: 0.2,
  },
  riderDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

// ── Dark mode map style ───────────────────────────────────────────────────────

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0F172A' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1E3A5F' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0C1A2E' }] },
];
