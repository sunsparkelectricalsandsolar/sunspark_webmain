"use client";

import { useState } from "react";

export function LocationPicker() {
  const [status, setStatus] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Current location is not available on this device.");
      return;
    }

    setStatus("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setLat(latitude);
        setLng(longitude);
        setMapUrl(`https://www.google.com/maps?q=${latitude},${longitude}`);
        setStatus("Location attached.");
      },
      () => setStatus("Location permission was not allowed. You can paste a Google Maps link instead."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  return (
    <div className="location-picker">
      <label>
        Delivery location
        <input name="deliveryLocation" placeholder="Estate, building, road, or shop pickup note" />
      </label>
      <label>
        Google Maps link
        <input name="deliveryMapUrl" value={mapUrl} onChange={(event) => setMapUrl(event.target.value)} placeholder="Paste Google Maps location link" />
      </label>
      <input name="deliveryLatitude" type="hidden" value={lat} />
      <input name="deliveryLongitude" type="hidden" value={lng} />
      <button className="secondary-btn" onClick={useCurrentLocation} type="button">Use current location</button>
      {status ? <p>{status}</p> : null}
    </div>
  );
}
