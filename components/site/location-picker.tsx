"use client";

import { useState } from "react";

const locationSuggestions = [
  "Nairobi CBD",
  "Duruma Road",
  "Downtown Tower",
  "River Road",
  "Tom Mboya Street",
  "Moi Avenue",
  "Westlands",
  "Eastleigh",
  "Industrial Area",
  "Ngara",
  "Kilimani",
  "Kasarani",
  "Embakasi",
  "Rongai",
  "Thika Road"
];

export function LocationPicker() {
  const [status, setStatus] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
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

  function updateTypedLocation(value: string) {
    setDeliveryLocation(value);
    if (value.trim().length >= 3 && !lat && !lng) {
      setMapUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${value}, Kenya`)}`);
    }
  }

  return (
    <div className="location-picker">
      <label>
        Delivery location
        <input
          list="delivery-location-suggestions"
          name="deliveryLocation"
          onChange={(event) => updateTypedLocation(event.target.value)}
          placeholder="Search estate, building, road, or shop pickup note"
          value={deliveryLocation}
        />
      </label>
      <datalist id="delivery-location-suggestions">
        {locationSuggestions.map((location) => (
          <option key={location} value={location} />
        ))}
      </datalist>
      <label>
        Google Maps link
        <input
          name="deliveryMapUrl"
          onChange={(event) => setMapUrl(event.target.value)}
          placeholder="Paste Google Maps location link"
          value={mapUrl}
        />
      </label>
      <input name="deliveryLatitude" type="hidden" value={lat} />
      <input name="deliveryLongitude" type="hidden" value={lng} />
      <div className="location-actions">
        <button className="secondary-btn" onClick={useCurrentLocation} type="button">Use current location</button>
        {mapUrl ? <a className="secondary-btn" href={mapUrl} rel="noreferrer" target="_blank">Check map</a> : null}
      </div>
      {status ? <p>{status}</p> : null}
    </div>
  );
}
