"use client";

import { useState } from "react";

const locationSuggestions = [
  "Nairobi CBD",
  "Downtown Tower, Duruma Road",
  "River Road, Nairobi",
  "Tom Mboya Street, Nairobi",
  "Moi Avenue, Nairobi",
  "Luthuli Avenue, Nairobi",
  "Accra Road, Nairobi",
  "Westlands, Nairobi",
  "Eastleigh, Nairobi",
  "Industrial Area, Nairobi",
  "Ngara, Nairobi",
  "Kilimani, Nairobi",
  "Kasarani, Nairobi",
  "Embakasi, Nairobi",
  "Rongai, Kajiado",
  "Thika Road, Nairobi",
  "Ruaka, Kiambu",
  "Kitengela, Kajiado",
  "Juja, Kiambu",
  "Ruiru, Kiambu",
  "Syokimau, Machakos",
  "Mlolongo, Machakos",
  "Karen, Nairobi",
  "South B, Nairobi",
  "South C, Nairobi",
  "Donholm, Nairobi",
  "Pipeline, Nairobi"
];

export function LocationPicker() {
  const [status, setStatus] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [focused, setFocused] = useState(false);

  const matches = locationSuggestions
    .filter((location) => {
      const query = deliveryLocation.trim().toLowerCase();
      return query ? location.toLowerCase().includes(query) : true;
    })
    .slice(0, 7);

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
        setDeliveryLocation(`Current location (${latitude}, ${longitude})`);
        setMapUrl(`https://www.google.com/maps?q=${latitude},${longitude}`);
        setStatus("Location attached.");
      },
      () => setStatus("Location permission was not allowed. You can paste a Google Maps link instead."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  function updateTypedLocation(value: string) {
    setDeliveryLocation(value);
    setLat("");
    setLng("");
    if (value.trim().length >= 3 && !lat && !lng) {
      setMapUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${value}, Kenya`)}`);
    }
  }

  function chooseLocation(value: string) {
    setDeliveryLocation(value);
    setLat("");
    setLng("");
    setMapUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${value}, Kenya`)}`);
    setFocused(false);
    setStatus("Location selected. Open the map to confirm the exact point.");
  }

  return (
    <div className="location-picker">
      <label>
        Delivery location
        <span className="location-search-box">
          <input
            autoComplete="off"
            name="deliveryLocation"
            onBlur={() => window.setTimeout(() => setFocused(false), 140)}
            onChange={(event) => updateTypedLocation(event.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search estate, building, road, pickup point..."
            value={deliveryLocation}
          />
          {focused ? (
            <span className="location-suggestions" role="listbox">
              {matches.map((location) => (
                <button key={location} onMouseDown={() => chooseLocation(location)} type="button">{location}</button>
              ))}
              {deliveryLocation.trim().length >= 3 ? (
                <button onMouseDown={() => chooseLocation(deliveryLocation)} type="button">Use "{deliveryLocation}" and open in Google Maps</button>
              ) : null}
            </span>
          ) : null}
        </span>
      </label>
      <label>
        Google Maps link for rider
        <input
          name="deliveryMapUrl"
          onChange={(event) => setMapUrl(event.target.value)}
          placeholder="Paste exact Google Maps link or choose/search above"
          value={mapUrl}
        />
      </label>
      <input name="deliveryLatitude" type="hidden" value={lat} />
      <input name="deliveryLongitude" type="hidden" value={lng} />
      <div className="location-actions">
        <button className="secondary-btn" onClick={useCurrentLocation} type="button">Use current location</button>
        {deliveryLocation && !mapUrl ? <button className="secondary-btn" onClick={() => chooseLocation(deliveryLocation)} type="button">Search on map</button> : null}
        {mapUrl ? <a className="secondary-btn" href={mapUrl} rel="noreferrer" target="_blank">Open exact map</a> : null}
      </div>
      {status ? <p>{status}</p> : null}
    </div>
  );
}
