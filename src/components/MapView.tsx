
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Route, Users } from 'lucide-react';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [activeMapTab, setActiveMapTab] = useState('spots');

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    mapboxgl.accessToken = 'pk.eyJ1IjoieXVuZ3JlemFjIiwiYSI6ImNtOW10ZzJ6bDBjNHUyanI3ejc5eXo1d2MifQ._tryk9cXjfReUGLGnNkm6Q';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [37.6176, 55.7558], // Moscow coordinates
      zoom: 10,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (activeMapTab === 'spots') {
      // Handle spot creation
      const coordinates = e.lngLat;
      console.log('Creating spot at:', coordinates);
      // TODO: Open spot creation dialog
    }
  };

  useEffect(() => {
    if (map.current) {
      map.current.on('click', handleMapClick);
      return () => {
        map.current?.off('click', handleMapClick);
      };
    }
  }, [activeMapTab]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sticky top-0 z-40">
        <h1 className="text-lg font-bold">Карта</h1>
      </div>

      {/* Map Tabs */}
      <div className="bg-white border-b">
        <Tabs value={activeMapTab} onValueChange={setActiveMapTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none h-12">
            <TabsTrigger value="spots" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Споты
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              Маршруты
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Онлайн
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Floating action buttons */}
        {activeMapTab === 'routes' && (
          <div className="absolute bottom-4 right-4">
            <Button className="rounded-full w-14 h-14 shadow-lg">
              <Route className="w-6 h-6" />
            </Button>
          </div>
        )}
        
        {activeMapTab === 'online' && (
          <div className="absolute bottom-4 right-4">
            <Button className="rounded-full w-14 h-14 shadow-lg">
              <Users className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Info overlay */}
      {activeMapTab === 'spots' && (
        <div className="absolute top-20 left-4 right-4 bg-white rounded-lg p-3 shadow-md">
          <p className="text-sm text-gray-600">
            Нажмите на карту, чтобы создать новый спот
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;
