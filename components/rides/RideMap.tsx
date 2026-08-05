/**
 * RideMap — Google Maps component for the NearU Rides section.
 *
 * Features:
 * - Pickup pin (cyan/NearU accent #2E9EBF)
 * - Dropoff pin (red #EF4444)
 * - Interactive map tap & landmark pins selection
 * - Live rider pin (pulsing dot)
 * - Dynamic route polyline connecting pickup ↔ dropoff
 * - Safe cross-platform provider handling & auto-fit camera
 */

import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, useColorScheme, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region, MapPressEvent } from 'react-native-maps';
import { Colors } from '../../constants/Colors';
import { LatLng } from '../../types/rides';
import { Navigation, MapPin } from 'lucide-react-native';

export interface CampusLandmark {
  label: string;
  lat: number;
  lng: number;
  type?: 'gate' | 'faculty' | 'hostel' | 'landmark';
}

export const SUSL_LANDMARKS: CampusLandmark[] = [
  { label: 'SUSL Main Gate', lat: 6.7146, lng: 80.7872, type: 'gate' },
  { label: 'Faculty of Computing', lat: 6.7121, lng: 80.7891, type: 'faculty' },
  { label: 'Faculty of Applied Sciences', lat: 6.7130, lng: 80.7865, type: 'faculty' },
  { label: 'Faculty of Management', lat: 6.7112, lng: 80.7880, type: 'faculty' },
  { label: 'Student Hostel Block A', lat: 6.7155, lng: 80.7860, type: 'hostel' },
  { label: 'Student Hostel Block C', lat: 6.7158, lng: 80.7855, type: 'hostel' },
  { label: 'Samanala Grounds', lat: 6.7100, lng: 80.7900, type: 'landmark' },
  { label: 'Pambahinna Town', lat: 6.7200, lng: 80.7800, type: 'landmark' },
  { label: 'Belihuloya Town', lat: 6.7250, lng: 80.7950, type: 'landmark' },
  { label: 'SUSL Library', lat: 6.7135, lng: 80.7875, type: 'landmark' },
  { label: 'Medical Centre', lat: 6.7140, lng: 80.7868, type: 'landmark' },
  { label: 'Administration Block', lat: 6.7125, lng: 80.7878, type: 'landmark' },
];

interface RideMapProps {
  pickup?: LatLng;
  dropoff?: LatLng;
  riderLocation?: LatLng;
  showRoute?: boolean;
  showLandmarks?: boolean;
  style?: object;
  /** If true, camera auto-fits to show all markers */
  autoFit?: boolean;
  /** Callback when user taps on the map */
  onMapPress?: (coord: LatLng) => void;
  /** Callback when user taps a campus landmark pin */
  onSelectLandmark?: (landmark: CampusLandmark) => void;
}

export default function RideMap({
  pickup,
  dropoff,
  riderLocation,
  showRoute = true,
  showLandmarks = true,
  style,
  autoFit = true,
  onMapPress,
  onSelectLandmark,
}: RideMapProps) {
  const mapRef = useRef<MapView>(null);
  const scheme = useColorScheme() ?? 'light';

  // Build list of all active user coordinates for camera fitting
  const visibleCoords: LatLng[] = [pickup, dropoff, riderLocation].filter(Boolean) as LatLng[];

  useEffect(() => {
    if (!autoFit || !mapRef.current || visibleCoords.length === 0) return;

    const t = setTimeout(() => {
      if (visibleCoords.length === 1) {
        mapRef.current?.animateToRegion({
          latitude: visibleCoords[0].latitude,
          longitude: visibleCoords[0].longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }, 500);
      } else {
        mapRef.current?.fitToCoordinates(visibleCoords, {
          edgePadding: { top: 60, right: 50, bottom: 60, left: 50 },
          animated: true,
        });
      }
    }, 250);

    return () => clearTimeout(t);
  }, [
    pickup?.latitude, pickup?.longitude,
    dropoff?.latitude, dropoff?.longitude,
    riderLocation?.latitude, riderLocation?.longitude,
    autoFit
  ]);

  // Default region centred on SUSL Main Campus
  const defaultRegion: Region = {
    latitude: 6.7146,
    longitude: 80.7872,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const routeCoords: LatLng[] =
    showRoute && pickup && dropoff ? [pickup, dropoff] : [];

  const handlePress = (e: MapPressEvent) => {
    if (onMapPress) {
      onMapPress(e.nativeEvent.coordinate);
    }
  };

  return (
    <MapView
      ref={mapRef}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={[styles.map, style]}
      initialRegion={defaultRegion}
      customMapStyle={scheme === 'dark' ? darkMapStyle : []}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={true}
      showsTraffic={false}
      toolbarEnabled={false}
      onPress={handlePress}
    >
      {/* ── Campus Landmark markers ─────────────────────────── */}
      {showLandmarks && SUSL_LANDMARKS.map((landmark) => {
        // Skip if this landmark is already selected as pickup or dropoff
        const isPickup = pickup && Math.abs(pickup.latitude - landmark.lat) < 0.0001 && Math.abs(pickup.longitude - landmark.lng) < 0.0001;
        const isDropoff = dropoff && Math.abs(dropoff.latitude - landmark.lat) < 0.0001 && Math.abs(dropoff.longitude - landmark.lng) < 0.0001;
        if (isPickup || isDropoff) return null;

        return (
          <Marker
            key={landmark.label}
            coordinate={{ latitude: landmark.lat, longitude: landmark.lng }}
            title={landmark.label}
            onPress={(e) => {
              e.stopPropagation();
              if (onSelectLandmark) onSelectLandmark(landmark);
            }}
          >
            <View style={styles.landmarkPin}>
              <View style={styles.landmarkDot} />
              <Text style={styles.landmarkText} numberOfLines={1}>
                {landmark.label.replace('Faculty of ', 'Fo').replace('Student Hostel ', '')}
              </Text>
            </View>
          </Marker>
        );
      })}

      {/* ── Pickup marker ───────────────────────────────────── */}
      {pickup && (
        <Marker coordinate={pickup} anchor={{ x: 0.5, y: 1 }} title="Pickup Location">
          <View style={styles.markerWrapper}>
            <View style={[styles.markerBadge, { backgroundColor: Colors.brand.accent }]}>
              <Text style={styles.markerBadgeText}>PICKUP</Text>
            </View>
            <View style={[styles.markerPin, { backgroundColor: Colors.brand.accent }]}>
              <MapPin size={15} color="#FFFFFF" />
            </View>
            <View style={[styles.markerTail, { borderTopColor: Colors.brand.accent }]} />
          </View>
        </Marker>
      )}

      {/* ── Dropoff marker ──────────────────────────────────── */}
      {dropoff && (
        <Marker coordinate={dropoff} anchor={{ x: 0.5, y: 1 }} title="Dropoff Location">
          <View style={styles.markerWrapper}>
            <View style={[styles.markerBadge, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.markerBadgeText}>DROPOFF</Text>
            </View>
            <View style={[styles.markerPin, { backgroundColor: '#EF4444' }]}>
              <MapPin size={15} color="#FFFFFF" />
            </View>
            <View style={[styles.markerTail, { borderTopColor: '#EF4444' }]} />
          </View>
        </Marker>
      )}

      {/* ── Rider live-location marker ───────────────────────── */}
      {riderLocation && (
        <Marker coordinate={riderLocation} anchor={{ x: 0.5, y: 0.5 }} title="Rider Location">
          <View style={styles.riderMarker}>
            <View style={styles.riderPulse} />
            <View style={[styles.riderDot, { backgroundColor: Colors.brand.accent }]}>
              <Navigation size={12} color="#FFFFFF" />
            </View>
          </View>
        </Marker>
      )}

      {/* ── Route polyline ───────────────────────────────────── */}
      {routeCoords.length === 2 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor={Colors.brand.accent}
          strokeWidth={4}
          lineDashPattern={[8, 6]}
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
  markerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  landmarkPin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 4,
  },
  landmarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E9EBF',
  },
  landmarkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
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
    opacity: 0.25,
  },
  riderDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
