import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronRight, LocateFixed, MapPin, Navigation, Search, X } from "lucide-react";
import { CircleMarker, MapContainer, Marker, Popup, Polyline, TileLayer, useMap, useMapEvents,Tooltip,} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, PageHead } from "../../../components/common/PagePrimitives";

const CAMPUS_CENTER = [10.044804304335432, 76.32487970544787];
const places = [
  { name: "Library", category: "Academic", walk: "-", position: [10.044175172746197, 76.32510487956118], verified: true },
  { name: "Seminar Complex", category: "Events", walk: "—", position: [10.0438832446153, 76.32442962877109], verified: true },
  { name: "CUSAT Restaurant", category: "Food", walk: "—", position: [10.042941068639792, 76.32837535639526], verified: true },
  { name: "CUSAT Cafe", category: "Food", walk: "—", position: [10.04316449959049, 76.32535734620122], verified: true },
  { name: "Administrative Office", category: "Administration", walk: "—", position: [10.043098959786239, 76.3243349949952], verified: true },
  { name: "Department of Instrumentation", category: "Academic", walk: "—", position: [10.044621906637964, 76.3274518099933], verified: true },
  { name: "Department of Computer Science", category: "Academic", walk: "—", position: [10.045321849433508, 76.32544560034142], verified: true },
  { name: "Department of Computer Applications", category: "Academic", walk: "—", position: [10.046179801835065, 76.32593590427045], verified: true },
  { name: "Department of Polymer Science and Rubber Technology", category: "Academic", walk: "—", position: [10.04611992064226, 76.32535287790932], verified: true },
  { name: "Department of Ship Technology", category: "Academic", walk: "—", position: [10.045337630914567, 76.32611383422639], verified: true },
  { name: "Department Of Electronics", category: "Academic", walk: "—", position: [10.044995948697535, 76.32549114467726], verified: true },
  { name: "School Of Environmental Studies", category: "Academic", walk: "—", position: [10.045725629133464, 76.32656196948291], verified: true },
  { name: "Centre for Budget Studies", category: "Academic", walk: "—", position: [10.04581339101273, 76.32724528667484], verified: true },
  { name: "Department of Biotechnology", category: "Academic", walk: "—", position: [10.044995948697535, 76.32549114467726], verified: true },
  { name: "Department of Instrumentation", category: "Academic", walk: "—", position: [10.044608125789615, 76.32741760144532], verified: true },
  { name: "Department of Applied Chemistry and Department of Physics", category: "Academic", walk: "—", position: [10.044186866988786, 76.32700761114627], verified: true },
  { name: "CUSAT Park", category: "Recreation", walk: "—", position: [10.044202607228039, 76.32464611997388], verified: true },
   { name: "Open Air Auditorium", category: "Events", walk: "—", position: [10.041936248298901, 76.3279339067763], verified: true },
  
];


function MapFocus({ place, userLocation, followUser }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation && followUser) {
      map.flyTo(userLocation, 18, { duration: 0.5 });
      return;
    }
    if (place?.position) map.flyTo(place.position, 17, { duration: 0.7 });
  }, [map, place, userLocation, followUser]);
  return null;
}

function MapInteraction({ setFollowUser }) {
  useMapEvents({ dragstart: () => setFollowUser(false) });
  return null;
}

function WalkingRoute({ userLocation, destination, onRoute }) {
  const [route, setRoute] = useState([]);

  useEffect(() => {
    if (!userLocation || !destination) {
      setRoute([]);
      onRoute(null);
      return;
    }

    let cancelled = false;
    async function getWalkingRoute() {
      try {
        const [lat1, lon1] = userLocation;
        const [lat2, lon2] = destination.position;
        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Route request failed: ${response.status}`);

        const data = await response.json();
        if (cancelled || data.code !== "Ok") throw new Error("No route returned");

        const route = data.routes[0];
        const decoded = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

        setRoute(decoded);
        onRoute({ distance: route.distance / 1000, time: route.duration });
      } catch (error) {
        if (!cancelled) {
          console.error("Walking route error:", error);
          setRoute([]);
          onRoute("error");
        }
      }
    }

    getWalkingRoute();
    return () => { cancelled = true; };
  }, [userLocation, destination, onRoute]);

  if (!route.length) return null;
  return <Polyline positions={route} pathOptions={{ color: "#2563eb", weight: 8, opacity: 0.8 }} />;
}
function decodePolyline(encoded, precision = 6) {
  if (!encoded) return [];
  const coordinates = [];
  let index = 0; let lat = 0; let lon = 0;
  const factor = 10 ** precision;

  while (index < encoded.length) {
    let result = 0; let shift = 0; let byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lon += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push([lat / factor, lon / factor]);
  }
  return coordinates;
}

function formatDistance(km) { return !km ? "" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`; }
function formatTime(seconds) {
  if (!seconds) return "";
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function CampusMap() {
  const { notify } = useOutletContext();
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [navigationActive, setNavigationActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [followUser, setFollowUser] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [liveWalkTime, setLiveWalkTime] = useState({});

  const verifiedPlaces = places.filter((place) => place.verified);
  const filteredPlaces = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? places.filter((place) => place.name.toLowerCase().includes(search)) : places;
  }, [query]);

 const selectPlace = (place) => { setSelectedPlace(place); setFollowUser(false); notify(`${place.name} selected`); };
  const locateUser = () => {
    if (!navigator.geolocation) { notify("Location services are not supported by this browser."); return; }
    if (userLocation) { setFollowUser(true); return; }
    setFollowUser(true);
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => setUserLocation([coords.latitude, coords.longitude]),
      () => { notify("Unable to get your location. Check browser permission."); setFollowUser(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 },
    );
    setWatchId(id);
    notify("Live location enabled");
  };

  useEffect(() => () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); }, [watchId]);

  const startNavigation = (place = selectedPlace) => {
    if (!place) { notify("Select a destination first."); return; }
    if (!place.verified) { notify(`${place.name} needs a verified coordinate.`); return; }
    setSelectedPlace(place);
    setNavigationActive(true);
    setFollowUser(true);
    setRouteInfo(null);
    if (!userLocation) {
      locateUser();
      notify("Finding your location...");
      return;
    }
    notify(`Starting navigation to ${place.name}`);
  };

  const stopNavigation = () => { setNavigationActive(false); setRouteInfo(null); notify("Navigation stopped"); };
  const handleRouteInfo = useCallback((info) => {
  setRouteInfo(info);

  if (info && info !== "error" && selectedPlace) {
    setLiveWalkTime((prev) => ({
      ...prev,
      [selectedPlace.name]: formatTime(info.time),
    }));
  }
}, [selectedPlace]);

  return (
    <>
      <PageHead eyebrow="CAMPUS NAVIGATION" title="University Map" desc="Find buildings, services and important campus locations." />
      <div className="map-layout">
        <Card className="map-card">
          <div className="campus-map" aria-label="Interactive university map">
            <div className="map-search-overlay"><label className="searchbox mapsearch"><Search size={17} /><input aria-label="Find a place" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search CUSAT..." /></label></div>
            <button type="button" className="map-locate" onClick={locateUser}><LocateFixed size={16} />{followUser ? "Following me" : "My location"}</button>

            <MapContainer center={CAMPUS_CENTER} zoom={17} scrollWheelZoom className="leaflet-map">
              <TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
              <MapFocus place={selectedPlace} userLocation={userLocation} followUser={followUser} />
              <MapInteraction setFollowUser={setFollowUser} />
              {userLocation && <CircleMarker center={userLocation} radius={10} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}><Popup><strong>You are here</strong></Popup></CircleMarker>}
              {selectedPlace && <Marker position={selectedPlace.position}><Popup><strong>{selectedPlace.name}</strong><br />{selectedPlace.category}<br /><button type="button" className="map-directions" onClick={() => startNavigation(selectedPlace)}><Navigation size={14} />Navigate here</button></Popup></Marker>}
             {verifiedPlaces.map((place) => <CircleMarker key={place.name} center={place.position} radius={selectedPlace?.name === place.name ? 11 : 8} pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#6557e8", fillOpacity: 1 }} eventHandlers={{ click: () => selectPlace(place) }}><Tooltip permanent direction="top" offset={[0, -8]}>{place.name}</Tooltip><Popup><strong>{place.name}</strong><br />{place.category}<br /><button type="button" className="map-directions" onClick={() => startNavigation(place)}><Navigation size={14} /> Navigate here</button></Popup></CircleMarker>)}
              {userLocation && selectedPlace && <WalkingRoute userLocation={userLocation} destination={selectedPlace} onRoute={handleRouteInfo} />}
            </MapContainer>

            {navigationActive && selectedPlace && <div className="navigation-panel"><div><span className="navigation-label">WALKING TO</span><strong>{selectedPlace.name}</strong>{routeInfo && routeInfo !== "error" && <span>{formatDistance(routeInfo.distance)} · {formatTime(routeInfo.time)}</span>}{routeInfo === "error" && <span>Unable to calculate route.</span>}</div><button type="button" onClick={stopNavigation} aria-label="Stop navigation"><X size={18} /></button></div>}
            {selectedPlace && !navigationActive && <div className="destination-panel"><div><span>DESTINATION</span><strong>{selectedPlace.name}</strong><small>{selectedPlace.category}</small></div><button type="button" onClick={() => startNavigation(selectedPlace)}><Navigation size={16} />Start</button></div>}
            <p className="map-note">Live location and navigation stay inside the app.</p>
          </div>
        </Card>

        <Card>
          <label className="searchbox mapsearch"><Search size={17} /><input aria-label="Find a place" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a place..." /></label>
          <div className="place-list">
  {filteredPlaces.length ? (
    filteredPlaces.map((place) => (
      <button
        className={selectedPlace?.name === place.name ? "selected" : ""}
        key={place.name}
        onClick={() => selectPlace(place)}
      >
        <div className="placeicon">
          <MapPin size={17} />
        </div>

        <div>
          <b>{place.name}</b>
          <span>
            {place.category} · {liveWalkTime[place.name] || place.walk} walk
          </span>
        </div>

        <ChevronRight size={15} />
      </button>
    ))
  ) : (
    <p className="map-empty">No places match “{query}”.</p>
  )}
</div>
        </Card>
      </div>
    </>
  );
}
